-- v43: Admin implementation guide (contest submissions, approval workflow, final tiers, Mission Briefing)
--
-- * Every member upload is a contest submission. The member picks an open round ("contest week");
--   the server validates the round, its deadline and the member's allowance for that round.
-- * The weekly allowance is counted per selected round (Free 2, Street 4, Hustler 8, Kingpin 12).
--   Disapproved and withdrawn clips still count. A retried request never takes a second slot.
-- * Only staff can decide a pending clip, once, through review_clip(); every decision is recorded.
-- * Mission Briefing: posts written in the console, readable by Street, Hustler and Kingpin members.

-- 1. Final allowances
update public.tiers set weekly_submissions = case id when 'free' then 2 when 'street' then 4 when 'hustler' then 8 when 'kingpin' then 12 end
 where id in ('free','street','hustler','kingpin');
update public.tiers set featured_per_month = case id when 'hustler' then 1 when 'kingpin' then 3 else 0 end
 where id in ('free','street','hustler','kingpin');

-- 2. The round that is taking clips right now (soonest entry deadline still ahead).
create or replace function public.round_taking_clips()
returns uuid language sql stable security definer set search_path = public as $$
  select id from contests where kind = 'weekly' and status not in ('closed','paid') and submissions_close >= now()
   order by submissions_close asc limit 1
$$;

-- 3. Slots belong to the round they were submitted to.
alter table public.upload_slots add column if not exists contest_id uuid references public.contests(id) on delete set null;
update public.upload_slots s set contest_id = c.contest_id from public.clips c where c.id = s.clip_id and s.contest_id is null;
create index if not exists upload_slots_user_contest on public.upload_slots (user_id, contest_id);

-- 4. Submissions: always for a contest, into the round the member chose (if it's still open).
create or replace function public.assign_round()
returns trigger language plpgsql security definer set search_path = public as $$
declare k contests;
begin
  if tg_op = 'INSERT' then
    new.submitted_at := now();
    if not is_admin() then new.for_contest := true; end if;
    if new.for_contest then
      perform ensure_weekly_rounds(2);
      if new.contest_id is null then
        new.contest_id := round_taking_clips();
        if new.contest_id is null then raise exception 'NO_OPEN_ROUND'; end if;
      else
        select * into k from contests where id = new.contest_id;
        if k.id is null or k.status in ('closed','paid') or k.submissions_close < new.submitted_at then
          raise exception 'ROUND_CLOSED';
        end if;
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
end $$;

-- 5. Allowance check, per selected round. Named to fire after clips_assign_round (triggers run in name order).
create or replace function public.check_round_cap()
returns trigger language plpgsql security definer set search_path = public as $$
declare cap int; used int;
begin
  if new.submitted_by is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('upload:' || new.submitted_by::text, 0));
  if new.idem_key is not null and exists (select 1 from clips where submitted_by = new.submitted_by and idem_key = new.idem_key) then
    raise exception 'DUPLICATE_SUBMISSION';
  end if;
  cap := coalesce(tier_allowance(new.submitted_by), 2);
  if new.contest_id is not null then
    select count(*) into used from upload_slots where user_id = new.submitted_by and contest_id = new.contest_id;
  else
    select count(*) into used from upload_slots where user_id = new.submitted_by and contest_id is null and week_start = upload_week_start(now());
  end if;
  if used >= cap then raise exception 'WEEKLY_LIMIT'; end if;
  return new;
end $$;
drop trigger if exists clip_weekly_cap on public.clips;
drop trigger if exists clips_quota_cap on public.clips;
create trigger clips_quota_cap before insert on public.clips for each row execute function public.check_round_cap();

create or replace function public.take_upload_slot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.submitted_by is not null then
    insert into upload_slots (user_id, clip_id, week_start, idem_key, contest_id)
    values (new.submitted_by, new.id,
            coalesce((select upload_week_start(voting_opens) from contests where id = new.contest_id), upload_week_start(now())),
            new.idem_key, new.contest_id);
  end if;
  return new;
end $$;

-- 6. Quota read-outs follow the round taking clips (or a round the member picked).
create or replace function public.submissions_this_week(p_user uuid default auth.uid())
returns integer language sql stable security definer set search_path = public as $$
  select case when p_user is distinct from auth.uid() and not coalesce(is_admin(), false) then 0
         else (select count(*)::int from upload_slots where user_id = p_user and contest_id = round_taking_clips()) end
$$;
create or replace function public.round_entries_close()
returns timestamptz language sql stable security definer set search_path = public as $$
  select submissions_close from contests where id = round_taking_clips()
$$;
drop function if exists public.my_submission_quota();
create or replace function public.my_submission_quota(p_contest uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with r as (select id, title, submissions_close from contests where id = coalesce(p_contest, round_taking_clips())),
       u as (select count(*)::int n from upload_slots, r where user_id = auth.uid() and contest_id = r.id)
  select jsonb_build_object(
    'allowance', tier_allowance(auth.uid()),
    'used', coalesce((select n from u), 0),
    'remaining', greatest(0, tier_allowance(auth.uid()) - coalesce((select n from u), 0)),
    'round_id', (select id from r), 'round_title', (select title from r),
    'resets_at', (select submissions_close from r))
$$;
grant execute on function public.my_submission_quota(uuid) to authenticated;

create or replace view public.my_account with (security_invoker = true) as
 SELECT p.id, p.display_name, p.tier, p.billing_period, p.subscription_status, p.current_period_end, p.credits_remaining,
    t.credits_per_month, (t.votes + p.bonus_votes) AS votes, t.weekly_submissions, t.ad_free, p.streak_days, p.best_streak,
    p.freezes_left, t.streak_freezes, my_stars() AS stars,
    submissions_this_week(p.id) AS submitted_week,
    round_entries_close() AS week_resets_at,
    COALESCE(b.pending_cents, 0) AS pending_cents, COALESCE(b.downloads, (0)::bigint) AS lifetime_downloads,
    ((SELECT count(*) FROM earned_badges e WHERE e.player_id = p.id))::integer AS badges, p.bonus_votes
   FROM profiles p
     JOIN tiers t ON t.id = CASE WHEN is_paying(p.id) THEN p.tier ELSE 'free'::text END
     LEFT JOIN creator_balances b ON b.creator_id = p.id
  WHERE p.id = auth.uid();

-- 7. Approval workflow: staff decide each pending clip exactly once; the decision is recorded.
create or replace function public.review_clip(p_clip uuid, p_decision text, p_reason text default null,
                                              p_edited_url text default null, p_ts int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c clips; k contests; me uuid := auth.uid(); r text;
begin
  select role into r from profiles where id = me and is_admin;
  if r is null or r not in ('reviewer','moderator','owner') then raise exception 'NOT_ALLOWED'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'BAD_DECISION'; end if;
  select * into c from clips where id = p_clip for update;
  if c.id is null then raise exception 'NOT_FOUND'; end if;
  if c.status <> 'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  if p_decision = 'approved' and c.for_contest and c.contest_id is not null then
    select * into k from contests where id = c.contest_id;
    if k.status in ('closed','paid') or k.voting_closes <= now() then raise exception 'ROUND_OVER'; end if;
  end if;
  perform set_config('app.reviewing', '1', true);
  update clips set status = p_decision, moderated_by = me, moderated_at = now(),
         reject_reason = case when p_decision = 'rejected' then nullif(p_reason, '') end,
         edited_url = coalesce(nullif(p_edited_url, ''), edited_url),
         youtube_timestamp = coalesce(p_ts, youtube_timestamp)
   where id = p_clip;
  insert into clip_moderation (clip_id, actor_id, action, note)
  values (p_clip, me, case when p_decision = 'approved' then 'approved' else 'disapproved' end, nullif(p_reason, ''));
  return jsonb_build_object('id', p_clip, 'status', p_decision, 'contest_id', c.contest_id, 'reviewed_at', now());
end $$;
revoke all on function public.review_clip(uuid, text, text, text, int) from public, anon;
grant execute on function public.review_clip(uuid, text, text, text, int) to authenticated;

-- Deciding a pending clip any other way is refused, so a decision can't be made twice or by someone else.
create or replace function public.guard_clip_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status in ('approved','rejected','featured')
     and coalesce(current_setting('app.reviewing', true), '') <> '1' then
    raise exception 'USE_REVIEW_QUEUE';
  end if;
  return new;
end $$;
drop trigger if exists clips_guard_review on public.clips;
create trigger clips_guard_review before update of status on public.clips for each row execute function public.guard_clip_review();

-- 8. Mission Briefing
create table if not exists public.mission_briefings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 140),
  mission text,
  summary text,
  body text not null,
  published boolean not null default false,
  author_id uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
alter table public.mission_briefings enable row level security;

create or replace function public.can_read_briefings()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(is_admin(), false) or exists (
    select 1 from profiles p join tiers t on t.id = p.tier
     where p.id = auth.uid() and is_paying(p.id) and t.rank >= 1)
$$;
grant execute on function public.can_read_briefings() to anon, authenticated;

drop policy if exists briefings_read on public.mission_briefings;
create policy briefings_read on public.mission_briefings for select
  using ((published and public.can_read_briefings()) or public.is_admin());
drop policy if exists briefings_write on public.mission_briefings;
create policy briefings_write on public.mission_briefings for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_briefing()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.published and (tg_op = 'INSERT' or not old.published) and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists briefings_touch on public.mission_briefings;
create trigger briefings_touch before insert or update on public.mission_briefings for each row execute function public.touch_briefing();

-- Locked teaser for everyone: titles and dates only, never the body.
create or replace function public.briefing_titles()
returns table(id uuid, title text, mission text, published_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, title, mission, published_at from mission_briefings where published order by published_at desc limit 20
$$;
grant execute on function public.briefing_titles() to anon, authenticated;

-- 9. Decision emails carry the contest name and the reviewer's note.
create or replace function public.mail_on_clip()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status in ('approved','rejected') then
    insert into public.email_outbox (user_id, kind, data, dedupe)
    values (coalesce(new.owner_id, new.submitted_by),
            case when new.status = 'approved' then 'clip_approved' else 'clip_disapproved' end,
            jsonb_build_object('title', new.title, 'clip_id', new.id,
              'round', (select title from contests where id = new.contest_id), 'reason', new.reject_reason),
            'clip:' || new.id::text || ':' || new.status)
    on conflict do nothing;
  end if;
  return new;
end $$;

-- 10. Members can no longer move a clip into a round themselves; contest entry is by staff approval only.
revoke execute on function public.enter_clip_in_round(uuid) from authenticated, anon, public;
