-- v26: download-only clips can enter a round later; round-open emails; email preferences.

-- 1. Which email types a member has switched off. Receipts, payouts, security
--    and support are not in this list and always arrive.
create table if not exists public.email_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  muted text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.email_prefs enable row level security;
drop policy if exists "prefs own read" on public.email_prefs;
drop policy if exists "prefs own write" on public.email_prefs;
drop policy if exists "prefs own update" on public.email_prefs;
create policy "prefs own read"   on public.email_prefs for select using (user_id = auth.uid());
create policy "prefs own write"  on public.email_prefs for insert with check (user_id = auth.uid() and muted <@ array['rounds','sales','approvals','badges']);
create policy "prefs own update" on public.email_prefs for update using (user_id = auth.uid()) with check (user_id = auth.uid() and muted <@ array['rounds','sales','approvals','badges']);
revoke all on public.email_prefs from anon;

-- 2. Let the owner of a download-only clip put it into the open round, and
--    nothing else. contest_id is otherwise frozen after upload.
create or replace function public.assign_round() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare k contests; r uuid;
begin
  if tg_op = 'INSERT' then
    new.submitted_at := now();
    if new.for_contest then
      select * into k from contests where id = new.contest_id;
      if k.id is null or k.kind = 'weekly' then
        perform ensure_weekly_rounds(2);
        select id into r from contests where kind = 'weekly' and submissions_close >= new.submitted_at
          and status not in ('closed','paid') order by submissions_close asc limit 1;
        if r is not null then new.contest_id := r; end if;
      elsif k.submissions_close < new.submitted_at then
        raise exception 'ROUND_CLOSED';
      end if;
    end if;
  else
    if new.contest_id is distinct from old.contest_id and not is_admin()
       and coalesce(current_setting('app.entering_round', true), '') <> '1' then
      raise exception 'ROUND_IMMUTABLE';
    end if;
    new.submitted_at := old.submitted_at;
    if new.status in ('approved','featured') and old.published_at is null then new.published_at := now(); end if;
    if new.published_at is distinct from old.published_at and old.published_at is not null then new.published_at := old.published_at; end if;
  end if;
  return new;
end $function$;

create or replace function public.enter_clip_in_round(p_clip uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c clips; r uuid;
begin
  select * into c from clips where id = p_clip;
  if c.id is null or c.owner_id is distinct from auth.uid() then raise exception 'NOT_YOURS'; end if;
  if c.status not in ('approved','featured') then raise exception 'NOT_LIVE'; end if;
  if c.for_contest or c.contest_id is not null then raise exception 'ALREADY_ENTERED'; end if;
  if c.duration_seconds is null or c.duration_seconds >= 180 then raise exception 'CLIP_TOO_LONG'; end if;
  perform ensure_weekly_rounds(2);
  select id into r from contests where kind = 'weekly' and timezone is not null
     and submissions_close > now() and status not in ('closed','paid') and coalesce(state,'') not in ('finalized','result_review')
   order by submissions_close asc limit 1;
  if r is null then raise exception 'NO_OPEN_ROUND'; end if;
  perform set_config('app.entering_round', '1', true);
  update clips set for_contest = true, contest_id = r where id = p_clip;
  return r;
end $$;
revoke all on function public.enter_clip_in_round(uuid) from public, anon;
grant execute on function public.enter_clip_in_round(uuid) to authenticated;

-- 3. When a weekly round opens, tell the people who have a live download-only clip.
alter table public.contests add column if not exists open_notified_at timestamptz;

create or replace function public.notify_round_open() returns integer
language plpgsql security definer set search_path = public as $$
declare k record; u record; n integer := 0;
begin
  for k in select id, title, submissions_close, voting_closes, timezone from contests
            where kind = 'weekly' and timezone is not null and open_notified_at is null
              and voting_opens <= now() and submissions_close > now() loop
    update contests set open_notified_at = now() where id = k.id;
    for u in select owner_id, count(*) as clips, (array_agg(title order by created_at desc))[1] as latest
               from clips
              where owner_id is not null and status in ('approved','featured')
                and for_contest = false and contest_id is null
                and duration_seconds is not null and duration_seconds < 180
              group by owner_id loop
      perform enqueue_email(u.owner_id, 'round_open',
        jsonb_build_object('round', k.title, 'closes', k.submissions_close, 'tz', k.timezone, 'clips', u.clips, 'latest', u.latest),
        'ro-' || k.id::text || '-' || u.owner_id::text);
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.notify_round_open() from public, anon, authenticated;

create or replace function public.round_tick() returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare r record; out jsonb := '[]';
begin
  perform ensure_weekly_rounds(2);
  perform notify_round_open();
  for r in select id from contests where timezone is not null and voting_closes <= now()
             and coalesce(state,'') not in ('finalized','result_review') order by voting_closes loop
    out := out || jsonb_build_object('round', r.id, 'outcome', finalize_round(r.id));
  end loop;
  return out;
end $function$;
