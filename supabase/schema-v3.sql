-- Live From Leonida — schema v3: new tier structure, prize brackets, Versus removed,
-- gamification (streaks, badges, Daily Drops, Trending) and clip tags.
-- Run AFTER schema.sql and schema-v2.sql. Safe to re-run.

-- ═════════════════════════════════════════════════════════════════
-- 1. Tiers: Free / Street / Hustler / Kingpin. Cartel is gone.
-- ═════════════════════════════════════════════════════════════════
alter table public.tiers add column if not exists votes smallint not null default 1;
alter table public.tiers add column if not exists streak_freezes smallint not null default 0;

-- Move anyone off the retired tiers before the check constraint is tightened.
alter table public.profiles drop constraint if exists profiles_tier_fkey;
update public.profiles set tier = 'street'  where tier = 'street';
update public.profiles set tier = 'kingpin' where tier = 'cartel';   -- Cartel folds into Kingpin
update public.profiles set tier = 'free'    where tier not in ('street','hustler','kingpin');
alter table public.profiles alter column tier set default 'free';

delete from public.tiers where id = 'cartel';
alter table public.tiers drop constraint if exists tiers_id_check;
alter table public.tiers add constraint tiers_id_check check (id in ('free','street','hustler','kingpin'));

-- 'street' used to be the free tier; it is now the $8 entry plan.
insert into public.tiers (id, label, rank, monthly_cents, annual_cents, credits_per_month,
                          vote_weight, extra_votes, votes, daily_submissions, streak_freezes, ad_free) values
  ('free',    'Free',    0,    0,     0,  0, 1, 0, 1,   2, 0, false),
  ('street',  'Street',  1,  800,  7500,  3, 1, 1, 2,  10, 0, true),
  ('hustler', 'Hustler', 2, 2000, 19200,  8, 1, 3, 4,  25, 1, true),
  ('kingpin', 'Kingpin', 3, 2500, 24000, 20, 1, 5, 6, 100, 3, true)
on conflict (id) do update set
  label = excluded.label, rank = excluded.rank,
  monthly_cents = excluded.monthly_cents, annual_cents = excluded.annual_cents,
  credits_per_month = excluded.credits_per_month, vote_weight = excluded.vote_weight,
  extra_votes = excluded.extra_votes, votes = excluded.votes,
  daily_submissions = excluded.daily_submissions, streak_freezes = excluded.streak_freezes,
  ad_free = excluded.ad_free;

alter table public.profiles add constraint profiles_tier_fkey
  foreign key (tier) references public.tiers(id);

-- ═════════════════════════════════════════════════════════════════
-- 1b. 'street' used to BE the free tier. It is now the $8 entry plan, so every
--     rule that used it to mean "not paying" has to be redefined against 'free'.
--     Without this a Street subscriber silently gets free-tier limits.
-- ═════════════════════════════════════════════════════════════════
create or replace function public.is_paying(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = p_user and tier <> 'free' and subscription_status in ('active','trialing')
  );
$$;

create or replace function public.my_tier() returns public.tiers
language sql stable security definer set search_path = public as $$
  select t.* from public.tiers t
   join public.profiles p on p.id = auth.uid()
   where t.id = case when public.is_paying(auth.uid()) then p.tier else 'free' end;
$$;

create or replace function public.paying_user_count() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles
   where tier <> 'free' and subscription_status in ('active','trialing');
$$;

create or replace function public.check_daily_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap integer;
begin
  select daily_submissions into cap from public.tiers
   where id = case when public.is_paying(new.submitted_by) then
                (select tier from public.profiles where id = new.submitted_by) else 'free' end;
  if (select count(*) from public.clips
       where submitted_by = new.submitted_by and created_at >= date_trunc('day', now())) >= cap then
    raise exception 'DAILY_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists clip_daily_cap on public.clips;
create trigger clip_daily_cap before insert on public.clips
  for each row execute function public.check_daily_cap();

-- ═════════════════════════════════════════════════════════════════
-- 2. Voting: a flat allowance per tier. No weighting, no per-round wording.
--    Paying members only, and only while the deadline window is open.
-- ═════════════════════════════════════════════════════════════════
alter table public.contests add column if not exists period text not null default 'week'
  check (period in ('week','month','year'));
-- Votes land in the final stretch before the round closes.
alter table public.contests add column if not exists deadline_hours smallint not null default 48;

create or replace function public.voting_open(p_contest uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.contests c
     where c.id = p_contest and c.status = 'voting'
       and now() <= c.voting_closes
       and now() >= greatest(c.voting_opens, c.voting_closes - make_interval(hours => c.deadline_hours))
  );
$$;

create or replace function public.my_votes_allowed() returns integer
language sql stable security definer set search_path = public as $$
  select t.votes from public.tiers t
   where t.id = case when public.is_paying(auth.uid())
                     then (select tier from public.profiles where id = auth.uid()) else 'free' end;
$$;

create or replace function public.cast_vote(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; allowed integer; used integer;
begin
  if auth.uid() is null then raise exception 'Sign in to vote'; end if;

  select ct.* into k from public.contests ct join public.clips cl on cl.contest_id = ct.id
   where cl.id = p_clip and cl.status in ('approved','featured');
  if k.id is null then raise exception 'Clip is not in a voting round'; end if;
  if not public.voting_open(k.id) then raise exception 'VOTING_CLOSED'; end if;
  if exists (select 1 from public.clips where id = p_clip and owner_id = auth.uid()) then
    raise exception 'You cannot vote for your own clip'; end if;

  allowed := public.my_votes_allowed();
  select count(*) into used from public.votes
   where contest_id = k.id and voter_id = auth.uid() and clip_id <> p_clip;

  if used >= allowed then
    if allowed = 1 then
      delete from public.votes where contest_id = k.id and voter_id = auth.uid();  -- free: the vote moves
    else
      raise exception 'OUT_OF_VOTES';
    end if;
  end if;

  insert into public.votes (contest_id, voter_id, clip_id, weight)
  values (k.id, auth.uid(), p_clip, 1)
  on conflict (contest_id, voter_id, clip_id) do nothing;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 3. Prize brackets — Clip of the Week, by paying members. Gold 60 / Silver 25 / Bronze 15.
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.prize_brackets (
  up_to integer primary key,        -- paying members up to and including this
  label text not null,
  pool_cents integer not null,
  gold_cents integer not null,
  silver_cents integer not null,
  bronze_cents integer not null,
  constraint prizes_fit_pool check (gold_cents + silver_cents + bronze_cents <= pool_cents)
);

insert into public.prize_brackets (up_to, label, pool_cents, gold_cents, silver_cents, bronze_cents) values
  (100,       '0 – 100',        2500,   1500,   625,   375),
  (200,       '100 – 200',      5000,   3000,  1250,   750),
  (400,       '200 – 400',     10000,   6000,  2500,  1500),
  (800,       '400 – 800',     20000,  12000,  5000,  3000),
  (1200,      '800 – 1,200',   30000,  18000,  7500,  4500),
  (2000,      '1,200 – 2,000', 50000,  30000, 12500,  7500),
  (4000,      '2,000 – 4,000', 100000, 60000, 25000, 15000),
  (6000,      '4,000 – 6,000', 150000, 90000, 37500, 22500),
  (10000,     '6,000 – 10,000',250000,150000, 62500, 37500),
  (2147483647,'10,000+',       300000,180000, 75000, 45000)
on conflict (up_to) do update set
  label = excluded.label, pool_cents = excluded.pool_cents, gold_cents = excluded.gold_cents,
  silver_cents = excluded.silver_cents, bronze_cents = excluded.bronze_cents;

alter table public.prize_brackets enable row level security;
drop policy if exists "brackets public" on public.prize_brackets;
create policy "brackets public" on public.prize_brackets for select using (true);

create or replace function public.bracket_for(p_payers integer default null)
returns public.prize_brackets language sql stable security definer set search_path = public as $$
  select * from public.prize_brackets
   where up_to >= coalesce(p_payers, public.paying_user_count())
   order by up_to limit 1;
$$;

-- Month runs at 4× the week, year at 20×.
create or replace function public.period_pool_cents(p_period text default 'week')
returns integer language sql stable security definer set search_path = public as $$
  select ((public.bracket_for()).pool_cents
          * case p_period when 'year' then 20 when 'month' then 4 else 1 end)::int;
$$;

create or replace function public.weekly_pool_cents(p_payers integer default null)
returns integer language sql stable security definer set search_path = public as $$
  select (public.bracket_for(p_payers)).pool_cents;
$$;

create or replace function public.monthly_pool_cents() returns integer
language sql stable security definer set search_path = public as $$
  select public.period_pool_cents('month');
$$;

drop view if exists public.pool_now;
create view public.pool_now
with (security_invoker = true) as
  select public.paying_user_count()            as paying_users,
         (public.bracket_for()).label          as bracket,
         (public.bracket_for()).pool_cents     as weekly_cents,
         (public.bracket_for()).gold_cents     as gold_cents,
         (public.bracket_for()).silver_cents   as silver_cents,
         (public.bracket_for()).bronze_cents   as bronze_cents,
         public.period_pool_cents('month')     as monthly_cents,
         public.period_pool_cents('year')      as yearly_cents;

-- Closing a round pays Gold, Silver and Bronze from the locked bracket.
create or replace function public.close_contest(p_contest uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; r record; i int := 0; cut int[]; mult int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into k from public.contests where id = p_contest;
  mult := case k.period when 'year' then 20 when 'month' then 4 else 1 end;
  select array[gold_cents * mult, silver_cents * mult, bronze_cents * mult] into cut
    from public.bracket_for(k.payers_at_open);

  for r in select c.id, c.owner_id, count(v.*) as score, c.created_at
             from public.clips c left join public.votes v on v.clip_id = c.id
            where c.contest_id = p_contest and c.status in ('approved','featured')
            group by c.id, c.owner_id, c.created_at
            order by score desc, c.created_at asc limit 3
  loop
    i := i + 1;
    insert into public.winnings (contest_id, clip_id, owner_id, place, amount_cents)
    values (p_contest, r.id, r.owner_id, i, cut[i])
    on conflict (contest_id, place) do nothing;
    -- a win is a badge
    insert into public.earned_badges (player_id, badge, clip_id)
    values (r.owner_id, k.period || '_' || (array['gold','silver','bronze'])[i], r.id)
    on conflict do nothing;
  end loop;
  update public.contests set status = 'closed' where id = p_contest;
  insert into public.money_events (kind, amount_cents, note)
  values ('contest_closed', k.pool_cents, k.title);
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 4. Versus is removed
-- ═════════════════════════════════════════════════════════════════
drop table if exists public.versus_applications cascade;
drop table if exists public.versus_events cascade;
delete from public.chat_channels where id = 'versus';
insert into public.chat_channels (id, label, description, members_only, min_rank, position)
values ('trending', 'Trending', 'This week''s Daily Drop winners and what''s climbing.', false, 0, 3)
on conflict (id) do update set label = excluded.label, description = excluded.description;

-- ═════════════════════════════════════════════════════════════════
-- 5. Streaks — upload a clip each day. Two missed days in a row ends it.
-- ═════════════════════════════════════════════════════════════════
alter table public.profiles add column if not exists streak_days integer not null default 0;
alter table public.profiles add column if not exists best_streak integer not null default 0;
alter table public.profiles add column if not exists last_upload_on date;
alter table public.profiles add column if not exists freezes_left smallint not null default 0;
alter table public.profiles add column if not exists subscribed_since timestamptz;

create or replace function public.touch_streak() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles; gap integer;
begin
  select * into p from public.profiles where id = new.submitted_by;
  if p.last_upload_on = current_date then return new; end if;        -- already counted today

  gap := case when p.last_upload_on is null then 999 else current_date - p.last_upload_on end;
  if gap = 1 then
    update public.profiles set streak_days = streak_days + 1 where id = p.id;
  elsif gap = 2 and p.freezes_left > 0 then
    -- one missed day, spend a freeze and keep the run alive
    update public.profiles set streak_days = streak_days + 1, freezes_left = freezes_left - 1
     where id = p.id;
  else
    update public.profiles set streak_days = 1 where id = p.id;      -- two clear days, start again
  end if;

  update public.profiles
     set last_upload_on = current_date,
         best_streak = greatest(best_streak, streak_days)
   where id = p.id;
  return new;
end $$;
drop trigger if exists clip_streak on public.clips;
create trigger clip_streak after insert on public.clips
  for each row execute function public.touch_streak();

-- Nightly: anyone who missed two clear days loses the run.
create or replace function public.expire_streaks() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with dead as (
    update public.profiles set streak_days = 0
     where streak_days > 0 and last_upload_on is not null
       and current_date - last_upload_on >= 2
     returning 1)
  select count(*) into n from dead;
  return n;
end $$;

create or replace view public.streak_board
with (security_invoker = true) as
  select p.id, p.display_name, p.tier, p.streak_days, p.best_streak,
         (p.streak_days >= 7) as hot_creator
    from public.profiles p
   where p.streak_days > 0
   order by p.streak_days desc, p.best_streak desc
   limit 100;

-- ═════════════════════════════════════════════════════════════════
-- 6. Clipper badges — earned by uploading, nothing else
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.badges (
  id text primary key,
  label text not null,
  blurb text not null,
  clips_needed integer,          -- null for badges that aren't upload milestones
  sort smallint not null default 0
);
insert into public.badges (id, label, blurb, clips_needed, sort) values
  ('clipper_1',   'First Clip',   'You sent one in.',            1,   1),
  ('clipper_10',  'Regular',      'Ten clips deep.',             10,  2),
  ('clipper_25',  'Local',        'Twenty-five clips.',          25,  3),
  ('clipper_50',  'Fixture',      'Fifty clips.',                50,  4),
  ('clipper_100', 'Leonida Made', 'One hundred clips.',          100, 5),
  ('clipper_250', 'Institution',  'Two hundred and fifty.',      250, 6),
  ('week_gold',   'Clip of the Week',   'First place, one week.',   null, 10),
  ('week_silver', 'Week Silver',        'Second place, one week.',  null, 11),
  ('week_bronze', 'Week Bronze',        'Third place, one week.',   null, 12),
  ('month_gold',  'Clip of the Month',  'First place, one month.',  null, 20),
  ('month_silver','Month Silver',       'Second, one month.',       null, 21),
  ('month_bronze','Month Bronze',       'Third, one month.',        null, 22),
  ('year_gold',   'Clip of the Year',   'First place, the year.',   null, 30),
  ('year_silver', 'Year Silver',        'Second, the year.',        null, 31),
  ('year_bronze', 'Year Bronze',        'Third, the year.',         null, 32),
  ('drop_winner', 'Daily Drop',   'Won a Daily Drop.',           null, 40)
on conflict (id) do update set label = excluded.label, blurb = excluded.blurb,
  clips_needed = excluded.clips_needed, sort = excluded.sort;

create table if not exists public.earned_badges (
  player_id uuid not null references public.profiles(id) on delete cascade,
  badge text not null references public.badges(id) on delete cascade,
  clip_id uuid references public.clips(id) on delete set null,
  earned_at timestamptz not null default now(),
  primary key (player_id, badge)
);
alter table public.badges enable row level security;
alter table public.earned_badges enable row level security;
drop policy if exists "badges public" on public.badges;
create policy "badges public" on public.badges for select using (true);
drop policy if exists "earned public" on public.earned_badges;
create policy "earned public" on public.earned_badges for select using (true);

-- Upload milestones award themselves.
create or replace function public.award_clipper() returns trigger
language plpgsql security definer set search_path = public as $$
declare total integer;
begin
  select count(*) into total from public.clips where submitted_by = new.submitted_by;
  insert into public.earned_badges (player_id, badge)
  select new.submitted_by, b.id from public.badges b
   where b.clips_needed is not null and b.clips_needed <= total
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists clip_badges on public.clips;
create trigger clip_badges after insert on public.clips
  for each row execute function public.award_clipper();

-- How far to the next Clipper badge.
create or replace view public.my_badge_progress
with (security_invoker = true) as
  select (select count(*) from public.clips where submitted_by = auth.uid())::int as clips,
         (select min(clips_needed) from public.badges
           where clips_needed > (select count(*) from public.clips where submitted_by = auth.uid()))::int as next_at,
         (select label from public.badges
           where clips_needed > (select count(*) from public.clips where submitted_by = auth.uid())
           order by clips_needed limit 1) as next_label;

-- ═════════════════════════════════════════════════════════════════
-- 7. Daily Drop challenges — open to everyone, winner gets a week in Trending
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.daily_drops (
  id uuid primary key default gen_random_uuid(),
  day date not null unique default current_date,
  theme text not null,
  blurb text,
  winner_clip_id uuid references public.clips(id) on delete set null,
  closes_at timestamptz not null default (current_date + 1)
);
alter table public.daily_drops enable row level security;
drop policy if exists "drops public" on public.daily_drops;
create policy "drops public" on public.daily_drops for select using (true);
drop policy if exists "drops admin" on public.daily_drops;
create policy "drops admin" on public.daily_drops for all using (public.is_admin());

alter table public.clips add column if not exists drop_id uuid references public.daily_drops(id) on delete set null;
alter table public.clips add column if not exists trending_until timestamptz;

create or replace function public.pick_drop_winner(p_drop uuid, p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.daily_drops set winner_clip_id = p_clip where id = p_drop;
  -- a full week in Trending, the whole point of entering
  update public.clips set trending_until = now() + interval '7 days' where id = p_clip
    returning owner_id into owner;
  insert into public.earned_badges (player_id, badge, clip_id)
  values (owner, 'drop_winner', p_clip) on conflict do nothing;
end $$;

create or replace view public.trending_now
with (security_invoker = true) as
  select c.* from public.clips c
   where c.trending_until > now() and c.status in ('approved','featured')
   order by c.trending_until desc;

-- ═════════════════════════════════════════════════════════════════
-- 8. Clip tags — at most three a clip
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.tags (
  slug text primary key,
  label text not null,
  grp text not null,
  flagged boolean not null default false   -- hidden behind a warning until the viewer opts in
);
alter table public.tags enable row level security;
drop policy if exists "tags public" on public.tags;
create policy "tags public" on public.tags for select using (true);
drop policy if exists "tags admin" on public.tags;
create policy "tags admin" on public.tags for all using (public.is_admin());

create table if not exists public.clip_tags (
  clip_id uuid not null references public.clips(id) on delete cascade,
  tag text not null references public.tags(slug) on delete cascade,
  primary key (clip_id, tag)
);
create index if not exists clip_tags_tag_idx on public.clip_tags(tag);
alter table public.clip_tags enable row level security;
drop policy if exists "clip tags public" on public.clip_tags;
create policy "clip tags public" on public.clip_tags for select using (true);
drop policy if exists "clip tags own" on public.clip_tags;
create policy "clip tags own" on public.clip_tags for all
  using (exists (select 1 from public.clips c where c.id = clip_id
                   and (c.submitted_by = auth.uid() or public.is_admin())));

create or replace function public.cap_clip_tags() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.clip_tags where clip_id = new.clip_id) >= 3 then
    raise exception 'TOO_MANY_TAGS';
  end if;
  return new;
end $$;
drop trigger if exists clip_tag_cap on public.clip_tags;
create trigger clip_tag_cap before insert on public.clip_tags
  for each row execute function public.cap_clip_tags();

-- ═════════════════════════════════════════════════════════════════
-- 9. Live activity — "14 people watching this clip right now"
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.clip_presence (
  clip_id uuid not null references public.clips(id) on delete cascade,
  viewer text not null,                    -- session id, not an account
  seen_at timestamptz not null default now(),
  primary key (clip_id, viewer)
);
alter table public.clip_presence enable row level security;
drop policy if exists "presence write" on public.clip_presence;
create policy "presence write" on public.clip_presence for all using (true) with check (true);

create or replace view public.watching_now
with (security_invoker = true) as
  select clip_id, count(*)::int as watchers
    from public.clip_presence
   where seen_at > now() - interval '90 seconds'
   group by clip_id;

-- Is the heavy money voting for this clip? Shown as a signal, never as names.
create or replace view public.kingpin_signal
with (security_invoker = true) as
  select v.clip_id, count(*)::int as kingpin_votes
    from public.votes v
    join public.profiles p on p.id = v.voter_id
   where p.tier = 'kingpin' and p.subscription_status in ('active','trialing')
   group by v.clip_id;

-- ═════════════════════════════════════════════════════════════════
-- 10. Tier-gated extras and the six-star tracker
-- ═════════════════════════════════════════════════════════════════
-- One star every four months subscribed; all six at two years.
create or replace function public.my_stars() returns integer
language sql stable security definer set search_path = public as $$
  select least(6, greatest(0, floor(
    extract(epoch from (now() - coalesce(subscribed_since, now()))) / (86400 * 30.4375) / 4
  )::int)) from public.profiles where id = auth.uid();
$$;

create or replace function public.my_rank() returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select t.rank from public.tiers t join public.profiles p on p.tier = t.id
                    where p.id = auth.uid() and public.is_paying(auth.uid())), 0);
$$;

create or replace function public.can_use(p_feature text) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_feature
    when 'economist'   then public.my_rank() >= 2   -- Hustler and up
    when 'meta_brief'  then public.my_rank() >= 2   -- Hustler and up
    when 'perf_lab'    then public.my_rank() >= 3   -- Kingpin only
    else false end;
$$;

-- Monthly credits expire with the cycle; they never roll over.
create or replace function public.grant_cycle_credits(p_user uuid, p_period_end timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare n integer; f smallint;
begin
  select t.credits_per_month, t.streak_freezes into n, f
    from public.tiers t join public.profiles p on p.tier = t.id where p.id = p_user;
  update public.profiles
     set credits_remaining = coalesce(n, 0),      -- replaced, not added to
         freezes_left = coalesce(f, 0),
         credits_reset_at = p_period_end,
         current_period_end = p_period_end,
         subscribed_since = coalesce(subscribed_since, now())
   where id = p_user;
end $$;

-- What the signed-in member sees about themselves.
drop view if exists public.my_account;
create view public.my_account
with (security_invoker = true) as
  select p.id, p.display_name, p.tier, p.billing_period, p.subscription_status,
         p.current_period_end, p.credits_remaining, t.credits_per_month,
         t.votes, t.daily_submissions, t.ad_free,
         p.streak_days, p.best_streak, p.freezes_left, t.streak_freezes,
         public.my_stars()              as stars,
         public.submissions_today(p.id) as submitted_today,
         coalesce(b.pending_cents, 0)   as pending_cents,
         coalesce(b.downloads, 0)       as lifetime_downloads,
         (select count(*) from public.earned_badges e where e.player_id = p.id)::int as badges
    from public.profiles p
    join public.tiers t on t.id = case when public.is_paying(p.id) then p.tier else 'free' end
    left join public.creator_balances b on b.creator_id = p.id
   where p.id = auth.uid();
