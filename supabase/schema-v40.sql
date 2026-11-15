-- v40: the $2,000 weekly cap, round-opening prize snapshots, and weekly clip allowances.

-- 1. Prize ladder. Ranges are inclusive and do not overlap: 0-99, 100-199, ... 6,000-9,999, 10,000+.
update public.prize_brackets set up_to = 99,   label = '0 – 99'          where up_to = 100;
update public.prize_brackets set up_to = 199,  label = '100 – 199'       where up_to = 200;
update public.prize_brackets set up_to = 399,  label = '200 – 399'       where up_to = 400;
update public.prize_brackets set up_to = 799,  label = '400 – 799'       where up_to = 800;
update public.prize_brackets set up_to = 1199, label = '800 – 1,199'     where up_to = 1200;
update public.prize_brackets set up_to = 1999, label = '1,200 – 1,999'   where up_to = 2000;
update public.prize_brackets set up_to = 3999, label = '2,000 – 3,999'   where up_to = 4000;
update public.prize_brackets set up_to = 5999, label = '4,000 – 5,999'   where up_to = 6000;
update public.prize_brackets set up_to = 9999, label = '6,000 – 9,999',
       pool_cents = 175000, gold_cents = 105000, silver_cents = 43750, bronze_cents = 26250 where up_to = 10000;
update public.prize_brackets set label = '10,000+',
       pool_cents = 200000, gold_cents = 120000, silver_cents = 50000, bronze_cents = 30000 where up_to = 2147483647;

-- 2. Each weekly round keeps the numbers it opened with. Later edits to the ladder never touch it.
alter table public.contests add column if not exists prize_cents integer[];

create or replace function public.lock_round_pool() returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n int; b public.prize_brackets; made int := 0;
begin
  n := public.paying_user_count();
  b := public.bracket_for(n);
  for r in select id from public.contests
            where timezone is not null and kind = 'weekly' and voting_opens <= now() and voting_closes > now()
              and payers_at_open is null for update loop
    update public.contests
       set payers_at_open = n, pool_cents = b.pool_cents, pool_locked_at = now(),
           prize_cents = array[b.gold_cents, b.silver_cents, b.bronze_cents]
     where id = r.id;
    insert into public.money_events (kind, amount_cents, note) values ('pool_locked', b.pool_cents, format('%s paying members', n));
    made := made + 1;
  end loop;
  return made;
end $$;
revoke all on function public.lock_round_pool() from public, anon, authenticated;

create or replace function public.round_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; out jsonb := '[]';
begin
  perform ensure_weekly_rounds(2);
  perform lock_round_pool();
  perform notify_round_open();
  for r in select id from contests where timezone is not null and voting_closes <= now()
             and coalesce(state,'') not in ('finalized','result_review') order by voting_closes loop
    out := out || jsonb_build_object('round', r.id, 'outcome', finalize_round(r.id));
  end loop;
  out := out || jsonb_build_object('published', publish_results());
  return out;
end $$;

-- Payouts read the round's own snapshot first; the ladder is only a fallback for rounds opened before this.
create or replace function public.close_contest(p_contest uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; r record; i int := 0; cut int[]; mult int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into k from public.contests where id = p_contest;
  if k.id is null then raise exception 'NO_SUCH_CONTEST'; end if;
  mult := case k.period when 'year' then 20 when 'month' then 4 else 1 end;
  if k.prize_cents is not null then
    cut := array[k.prize_cents[1] * mult, k.prize_cents[2] * mult, k.prize_cents[3] * mult];
  else
    select array[gold_cents * mult, silver_cents * mult, bronze_cents * mult] into cut
      from public.bracket_for(k.payers_at_open);
  end if;
  for r in select c.id, c.owner_id, count(v.*) as score, c.created_at
             from public.clips c left join public.votes v on v.clip_id = c.id
            where c.contest_id = p_contest and c.status in ('approved','featured')
            group by c.id, c.owner_id, c.created_at
            order by score desc, c.created_at asc limit 3
  loop
    i := i + 1;
    insert into public.winnings (contest_id, clip_id, owner_id, place, amount_cents)
    values (p_contest, r.id, r.owner_id, i, cut[i]) on conflict (contest_id, place) do nothing;
    if r.owner_id is not null then
      insert into public.earned_badges (player_id, badge, clip_id)
      values (r.owner_id, k.period || '_' || (array['gold','silver','bronze'])[i], r.id)
      on conflict do nothing;
    end if;
  end loop;
  update public.contests set status = 'closed' where id = p_contest;
  insert into public.money_events (kind, amount_cents, note) values ('contest_closed', k.pool_cents, k.title);
end $$;

create or replace function public.publish_results() returns integer
language plpgsql security definer set search_path = public as $$
declare k record; rr record; e jsonb; i int; cut int[]; mult int; made int := 0; cl record;
begin
  for k in select c.* from contests c join round_results x on x.contest_id = c.id and x.result_version = c.result_version
            where c.timezone is not null and c.state = 'finalized' and x.announced_at is null
              and c.voting_closes + interval '1 hour' <= now() for update of c loop
    select * into rr from round_results where contest_id = k.id and result_version = k.result_version;
    mult := case k.period when 'year' then 20 when 'month' then 4 else 1 end;
    if k.prize_cents is not null then
      cut := array[k.prize_cents[1] * mult, k.prize_cents[2] * mult, k.prize_cents[3] * mult];
    else
      select array[gold_cents * mult, silver_cents * mult, bronze_cents * mult]
        into cut from public.bracket_for(coalesce(k.payers_at_open, public.paying_user_count()));
    end if;
    i := 0;
    for e in select * from jsonb_array_elements(rr.tally) loop
      i := i + 1; exit when i > 3;
      continue when (e->>'votes')::int = 0;
      select id, owner_id into cl from clips where id = (e->>'clip')::uuid;
      insert into winnings (contest_id, clip_id, owner_id, place, amount_cents)
        values (k.id, cl.id, cl.owner_id, i, cut[i]) on conflict (contest_id, place) do nothing;
      if cl.owner_id is not null then
        insert into earned_badges (player_id, badge, clip_id)
          values (cl.owner_id, k.period || '_' || (array['gold','silver','bronze'])[i], cl.id) on conflict do nothing;
      end if;
      if i = 1 then
        insert into winner_badges (contest_id, clip_id, creator_id) values (k.id, cl.id, cl.owner_id) on conflict do nothing;
      end if;
    end loop;
    update round_results set announced_at = now() where contest_id = k.id and result_version = k.result_version;
    perform mail_round_participants(k.id);
    made := made + 1;
  end loop;
  return made;
end $$;
revoke all on function public.publish_results() from anon, authenticated;

-- 3. Weekly clip allowances: Free 2 / Street 4 / Hustler 8 / Kingpin 15.
alter table public.tiers add column if not exists weekly_submissions smallint;
update public.tiers set weekly_submissions = case id when 'free' then 2 when 'street' then 4 when 'hustler' then 8 when 'kingpin' then 15 end;
alter table public.tiers alter column weekly_submissions set not null;

-- The upload week runs Thursday 12:00 Eastern to the next Thursday 12:00, start inclusive, end exclusive.
-- 1:00 p.m. results do not reset it. One resolver, used by the database and echoed in the UI.
create or replace function public.upload_week_start(p_at timestamptz default now()) returns timestamptz
language plpgsql stable set search_path = public as $$
declare loc timestamp := p_at at time zone 'America/New_York'; back int; st timestamp;
begin
  back := (extract(isodow from loc)::int - 4 + 7) % 7;
  st := ((loc::date - back)::timestamp) + interval '12 hours';
  if st > loc then st := st - interval '7 days'; end if;
  return st at time zone 'America/New_York';
end $$;

create or replace function public.upload_week_end(p_start timestamptz) returns timestamptz
language sql stable set search_path = public as $$
  select ((p_start at time zone 'America/New_York') + interval '7 days') at time zone 'America/New_York'
$$;

-- Every accepted submission takes one slot. Deleting or rejecting the clip never gives it back.
create table if not exists public.upload_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  clip_id uuid references public.clips(id) on delete set null,
  week_start timestamptz not null,
  idem_key text,
  created_at timestamptz not null default now()
);
create index if not exists upload_slots_user_week on public.upload_slots (user_id, week_start);
create unique index if not exists upload_slots_idem on public.upload_slots (user_id, idem_key) where idem_key is not null;
alter table public.upload_slots enable row level security;   -- no policies: only the functions below touch it

alter table public.clips add column if not exists idem_key text;
create unique index if not exists clips_idem on public.clips (submitted_by, idem_key) where idem_key is not null;

-- One-off: clips already sent this week keep their slot.
insert into public.upload_slots (user_id, clip_id, week_start, created_at)
select c.submitted_by, c.id, public.upload_week_start(c.created_at), c.created_at
  from public.clips c
 where c.submitted_by is not null and exists (select 1 from public.profiles p where p.id = c.submitted_by)
   and not exists (select 1 from public.upload_slots s where s.clip_id = c.id);

create or replace function public.tier_allowance(p_user uuid) returns integer
language sql stable security definer set search_path = public as $$
  select t.weekly_submissions::int from public.tiers t
   where t.id = case when public.is_paying(p_user) then (select tier from public.profiles where id = p_user) else 'free' end
$$;

create or replace function public.submissions_this_week(p_user uuid default auth.uid()) returns integer
language sql stable security definer set search_path = public as $$
  select case when p_user is distinct from auth.uid() and not coalesce(public.is_admin(), false) then 0
         else (select count(*)::int from public.upload_slots where user_id = p_user and week_start = public.upload_week_start(now())) end
$$;
grant execute on function public.submissions_this_week(uuid) to authenticated;
revoke all on function public.submissions_this_week(uuid) from anon;

create or replace function public.my_submission_quota() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'allowance', public.tier_allowance(auth.uid()),
    'used', public.submissions_this_week(auth.uid()),
    'remaining', greatest(0, public.tier_allowance(auth.uid()) - public.submissions_this_week(auth.uid())),
    'week_start', public.upload_week_start(now()),
    'resets_at', public.upload_week_end(public.upload_week_start(now())))
$$;
grant execute on function public.my_submission_quota() to authenticated;
revoke all on function public.my_submission_quota() from anon;

create or replace function public.can_submit() returns boolean
language sql stable security definer set search_path = public as $$
  select public.submissions_this_week(auth.uid()) < public.tier_allowance(auth.uid())
$$;

-- Enforced in the database. The advisory lock makes parallel uploads queue up, so none can slip past the limit.
drop trigger if exists clip_daily_cap on public.clips;
create or replace function public.check_weekly_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int; used int;
begin
  if new.submitted_by is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('upload:' || new.submitted_by::text, 0));
  cap := coalesce(public.tier_allowance(new.submitted_by), 2);
  select count(*) into used from public.upload_slots
   where user_id = new.submitted_by and week_start = public.upload_week_start(now());
  if used >= cap then raise exception 'WEEKLY_LIMIT'; end if;
  return new;
end $$;
drop trigger if exists clip_weekly_cap on public.clips;
create trigger clip_weekly_cap before insert on public.clips
  for each row execute function public.check_weekly_cap();

create or replace function public.take_upload_slot() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.submitted_by is not null then
    insert into public.upload_slots (user_id, clip_id, week_start, idem_key)
    values (new.submitted_by, new.id, public.upload_week_start(now()), new.idem_key);
  end if;
  return new;
end $$;
drop trigger if exists clip_take_slot on public.clips;
create trigger clip_take_slot after insert on public.clips
  for each row execute function public.take_upload_slot();

-- The old daily counters go; account views carry the weekly numbers instead.
drop view if exists public.my_account;
create view public.my_account with (security_invoker = true) as
 SELECT p.id, p.display_name, p.tier, p.billing_period, p.subscription_status, p.current_period_end,
    p.credits_remaining, t.credits_per_month, (t.votes + p.bonus_votes) AS votes,
    t.weekly_submissions, t.ad_free, p.streak_days, p.best_streak, p.freezes_left, t.streak_freezes,
    my_stars() AS stars,
    submissions_this_week(p.id) AS submitted_week,
    public.upload_week_end(public.upload_week_start(now())) AS week_resets_at,
    COALESCE(b.pending_cents, 0) AS pending_cents,
    COALESCE(b.downloads, (0)::bigint) AS lifetime_downloads,
    (( SELECT count(*) FROM earned_badges e WHERE (e.player_id = p.id)))::integer AS badges,
    p.bonus_votes
   FROM ((profiles p JOIN tiers t ON ((t.id = CASE WHEN is_paying(p.id) THEN p.tier ELSE 'free'::text END)))
     LEFT JOIN creator_balances b ON ((b.creator_id = p.id)))
  WHERE (p.id = auth.uid());
grant select on public.my_account to authenticated;
revoke all on public.my_account from anon;

drop function if exists public.console_people(text, integer);
create or replace function public.console_people(p_q text default null, p_limit integer default 60)
returns table(id uuid, display_name text, gamertag text, platform text, gamertag_verified boolean, verify_status text, role text, tier text,
  subscription_status text, billing_period text, credits_remaining integer, credits_per_month integer, votes_allowed integer, votes_used integer,
  weekly_submissions integer, submitted_week integer, streak_days integer, wallet_cents integer, pending_cents integer, lifetime_downloads bigint,
  clips integer, created_at timestamp with time zone)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.gamertag, p.platform, p.gamertag_verified,
         p.verify_status, p.role, p.tier, p.subscription_status, p.billing_period,
         p.credits_remaining, t.credits_per_month,
         (t.votes + coalesce(p.bonus_votes,0))::int as votes_allowed,
         (select count(*) from votes v
            where v.voter_id = p.id
              and v.contest_id = (select id from contests order by created_at desc limit 1))::int as votes_used,
         t.weekly_submissions::int,
         (select count(*)::int from upload_slots s where s.user_id = p.id and s.week_start = public.upload_week_start(now())),
         p.streak_days,
         (select coalesce(sum(amount_cents),0)::int from wallet_entries w where w.player_id = p.id),
         coalesce(b.pending_cents,0), coalesce(b.downloads,0),
         (select count(*) from clips c where c.owner_id = p.id)::int,
         p.created_at
    from profiles p
    join tiers t on t.id = case when is_paying(p.id) then p.tier else 'free' end
    left join creator_balances b on b.creator_id = p.id
   where public.is_admin()
     and (p_q is null or p_q = ''
          or p.display_name ilike '%'||p_q||'%'
          or p.gamertag    ilike '%'||p_q||'%'
          or p.id::text = p_q)
   order by p.created_at desc
   limit greatest(1, least(p_limit, 200));
$$;
grant execute on function public.console_people(text, integer) to authenticated;
