-- Live From Leonida — schema v2: subscriptions, credits, downloads, creator pay,
-- weighted voting, scaling prize pool, freemium limits, in-web chat, audit trail.
-- Run AFTER schema.sql in the Supabase SQL editor. Safe to re-run.

create extension if not exists "pgcrypto";

-- ═════════════════════════════════════════════════════════════════
-- 1. Tiers and subscriptions
-- ═════════════════════════════════════════════════════════════════
-- Prices are stored here so they can be changed without a deploy.
create table if not exists public.tiers (
  id text primary key check (id in ('street','hustler','kingpin','cartel')),
  label text not null,
  rank smallint not null,                 -- 0 free, 3 highest
  monthly_cents integer not null,
  annual_cents integer not null,
  credits_per_month integer not null,     -- free download credits each cycle
  vote_weight smallint not null,          -- how much one of their votes counts
  extra_votes smallint not null,          -- votes beyond the first, on different clips
  daily_submissions smallint not null,    -- clips per day
  ad_free boolean not null default false
);

insert into public.tiers (id, label, rank, monthly_cents, annual_cents, credits_per_month, vote_weight, extra_votes, daily_submissions, ad_free) values
  ('street',  'Street',  0,    0,     0,  0, 1, 0,  2, false),
  ('hustler', 'Hustler', 1,  800,  7500,  3, 3, 3, 10, true),
  ('kingpin', 'Kingpin', 2, 2000, 19200,  8, 5, 3, 25, true),
  ('cartel',  'Cartel',  3, 4500, 43000, 20, 8, 3, 100, true)
on conflict (id) do update set
  label = excluded.label, rank = excluded.rank,
  monthly_cents = excluded.monthly_cents, annual_cents = excluded.annual_cents,
  credits_per_month = excluded.credits_per_month, vote_weight = excluded.vote_weight,
  extra_votes = excluded.extra_votes, daily_submissions = excluded.daily_submissions,
  ad_free = excluded.ad_free;

alter table public.tiers enable row level security;
create policy "tiers public" on public.tiers for select using (true);

-- Subscription state lives on the profile so every policy can read it cheaply.
alter table public.profiles add column if not exists tier text not null default 'street'
  references public.tiers(id);
alter table public.profiles add column if not exists billing_period text
  check (billing_period in ('monthly','annual'));
alter table public.profiles add column if not exists subscription_status text not null default 'none'
  check (subscription_status in ('none','active','past_due','canceled','trialing'));
alter table public.profiles add column if not exists stripe_customer_id text unique;
alter table public.profiles add column if not exists stripe_subscription_id text unique;
alter table public.profiles add column if not exists current_period_end timestamptz;
alter table public.profiles add column if not exists credits_remaining integer not null default 0;
alter table public.profiles add column if not exists credits_reset_at timestamptz;

create index if not exists profiles_paying_idx on public.profiles(tier, subscription_status);

-- A paying member is on a non-free tier with a subscription that is good right now.
create or replace function public.is_paying(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = p_user and tier <> 'street' and subscription_status in ('active','trialing')
  );
$$;

create or replace function public.my_tier() returns public.tiers
language sql stable security definer set search_path = public as $$
  select t.* from public.tiers t
   join public.profiles p on p.id = auth.uid()
   where t.id = case when public.is_paying(auth.uid()) then p.tier else 'street' end;
$$;

-- Every Stripe event we act on, kept for reconciliation.
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete set null,
  stripe_event_id text unique,            -- makes webhook retries idempotent
  kind text not null,
  tier text, billing_period text, status text,
  amount_cents integer,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.subscription_events enable row level security;
create policy "sub events own" on public.subscription_events for select
  using (player_id = auth.uid() or public.is_admin());

-- Credits are granted at the start of each billing cycle and do not roll over.
create or replace function public.grant_cycle_credits(p_user uuid, p_period_end timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  select t.credits_per_month into n
    from public.tiers t join public.profiles p on p.tier = t.id where p.id = p_user;
  update public.profiles
     set credits_remaining = coalesce(n, 0),
         credits_reset_at  = p_period_end,
         current_period_end = p_period_end
   where id = p_user;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 2. Downloads, credits and creator earnings
-- ═════════════════════════════════════════════════════════════════
-- $0.99 a download: $0.70 to the creator, $0.29 to the platform.
-- A credit download pays the creator exactly the same $0.70.
create table if not exists public.download_prices (
  id boolean primary key default true check (id),
  price_cents integer not null default 99,
  creator_cents integer not null default 70,
  platform_cents integer not null default 29,
  constraint split_adds_up check (creator_cents + platform_cents = price_cents)
);
insert into public.download_prices default values on conflict do nothing;
alter table public.download_prices enable row level security;
create policy "prices public" on public.download_prices for select using (true);
create policy "prices admin" on public.download_prices for update using (public.is_admin());

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete set null,
  downloader_id uuid not null references public.profiles(id) on delete cascade,
  credit_type text not null check (credit_type in ('credit','paid')),
  charged_cents integer not null default 0,     -- 0 for a credit download, 99 for a paid one
  creator_cents integer not null,               -- 70 either way
  platform_cents integer not null,
  stripe_payment_intent text,                   -- set for paid downloads
  payout_id uuid,                               -- filled in when the month is paid out
  created_at timestamptz not null default now()
);
create index if not exists downloads_creator_idx on public.downloads(creator_id, payout_id);
create index if not exists downloads_clip_idx on public.downloads(clip_id);
alter table public.downloads enable row level security;
create policy "downloads mine" on public.downloads for select
  using (downloader_id = auth.uid() or creator_id = auth.uid() or public.is_admin());

-- Spend a credit and record the download. Atomic: the credit cannot be spent twice.
create or replace function public.download_with_credit(p_clip uuid)
returns public.downloads language plpgsql security definer set search_path = public as $$
declare pr public.download_prices; cl public.clips; row public.downloads; left_now integer;
begin
  if auth.uid() is null then raise exception 'Sign in to download'; end if;
  if not public.is_paying(auth.uid()) then
    raise exception 'Downloads are for members. Free accounts can stream.'; end if;

  select * into cl from public.clips where id = p_clip and status in ('approved','featured');
  if cl.id is null then raise exception 'That clip is not available'; end if;
  select * into pr from public.download_prices where id;

  -- single statement, so two clicks cannot both take the last credit
  update public.profiles set credits_remaining = credits_remaining - 1
   where id = auth.uid() and credits_remaining > 0
   returning credits_remaining into left_now;
  if left_now is null then raise exception 'NO_CREDITS'; end if;

  insert into public.downloads (clip_id, creator_id, downloader_id, credit_type,
                                charged_cents, creator_cents, platform_cents)
  values (p_clip, cl.owner_id, auth.uid(), 'credit', 0, pr.creator_cents, 0)
  returning * into row;

  insert into public.money_events (kind, player_id, clip_id, amount_cents, note)
  values ('download_credit', auth.uid(), p_clip, 0, 'credit spent; creator credited');
  return row;
end $$;

-- Called by the Stripe webhook once a $0.99 charge succeeds.
create or replace function public.record_paid_download(
  p_clip uuid, p_downloader uuid, p_payment_intent text)
returns public.downloads language plpgsql security definer set search_path = public as $$
declare pr public.download_prices; cl public.clips; row public.downloads;
begin
  select * into row from public.downloads where stripe_payment_intent = p_payment_intent;
  if row.id is not null then return row; end if;          -- webhook retried

  select * into cl from public.clips where id = p_clip;
  select * into pr from public.download_prices where id;
  insert into public.downloads (clip_id, creator_id, downloader_id, credit_type,
                                charged_cents, creator_cents, platform_cents, stripe_payment_intent)
  values (p_clip, cl.owner_id, p_downloader, 'paid',
          pr.price_cents, pr.creator_cents, pr.platform_cents, p_payment_intent)
  returning * into row;

  insert into public.money_events (kind, player_id, clip_id, amount_cents, note)
  values ('download_paid', p_downloader, p_clip, pr.price_cents, 'paid download');
  return row;
end $$;

-- What a creator is owed but has not been paid yet.
create or replace view public.creator_balances
with (security_invoker = true) as
  select creator_id,
         count(*)                                  as downloads,
         count(*) filter (where credit_type = 'paid')   as paid_downloads,
         count(*) filter (where credit_type = 'credit') as credit_downloads,
         sum(creator_cents)::int                   as pending_cents,
         min(created_at)                           as oldest_unpaid
    from public.downloads
   where payout_id is null and creator_id is not null
   group by creator_id;

-- ═════════════════════════════════════════════════════════════════
-- 3. Creator payouts — monthly, paid by hand (PayPal / Venmo / Cash App / Interac / Wise)
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount_cents integer not null,
  download_count integer not null default 0,
  method text check (method in ('paypal','venmo','cashapp','interac','wise')),
  handle text,
  status text not null default 'pending'
    check (status in ('pending','approved','sent','failed','held')),
  reference text,                       -- transaction id once sent
  note text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists payouts_creator_idx on public.payouts(creator_id, status);
alter table public.payouts enable row level security;
create policy "payouts own" on public.payouts for select
  using (creator_id = auth.uid() or public.is_admin());
create policy "payouts admin" on public.payouts for all using (public.is_admin());

-- Minimum balance before a payout is cut; anything smaller rolls into next month.
alter table public.site_settings add column if not exists min_payout_cents integer not null default 1000;
alter table public.site_settings add column if not exists monthly_pool_multiple numeric not null default 4;

-- Close a month: one payout row per creator over the threshold, and stamp the downloads.
create or replace function public.run_monthly_payouts(p_start date, p_end date)
returns integer language plpgsql security definer set search_path = public as $$
declare r record; made integer := 0; floor_cents integer; pid uuid;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select min_payout_cents into floor_cents from public.site_settings where id;

  for r in
    select d.creator_id, sum(d.creator_cents)::int as cents, count(*)::int as n,
           p.payout_method, p.payout_handle
      from public.downloads d
      join public.profiles p on p.id = d.creator_id
     where d.payout_id is null
       and d.created_at >= p_start and d.created_at < (p_end + 1)
     group by d.creator_id, p.payout_method, p.payout_handle
    having sum(d.creator_cents) >= floor_cents
  loop
    insert into public.payouts (creator_id, period_start, period_end, amount_cents,
                                download_count, method, handle)
    values (r.creator_id, p_start, p_end, r.cents, r.n, r.payout_method, r.payout_handle)
    returning id into pid;

    update public.downloads set payout_id = pid
     where creator_id = r.creator_id and payout_id is null
       and created_at >= p_start and created_at < (p_end + 1);

    insert into public.money_events (kind, player_id, amount_cents, note)
    values ('payout_created', r.creator_id, r.cents,
            format('%s downloads, %s to %s', r.n, p_start, p_end));
    made := made + 1;
  end loop;
  return made;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 4. Weighted voting
-- ═════════════════════════════════════════════════════════════════
-- Free: one vote. Paying: that vote plus three more, each on a different clip,
-- and every vote carries their tier's weight.
alter table public.votes add column if not exists weight smallint not null default 1;

-- The old table allowed one row per voter per contest. Paying members need several.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.votes'::regclass and contype = 'p'
       and pg_get_constraintdef(oid) = 'PRIMARY KEY (contest_id, voter_id)'
  ) then
    alter table public.votes drop constraint votes_pkey;
    alter table public.votes add primary key (contest_id, voter_id, clip_id);
  end if;
end $$;

create or replace function public.cast_vote(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; t public.tiers; used integer; allowed integer;
begin
  if auth.uid() is null then raise exception 'Sign in to vote'; end if;

  select ct.* into k from public.contests ct join public.clips cl on cl.contest_id = ct.id
   where cl.id = p_clip and cl.status in ('approved','featured');
  if k.id is null then raise exception 'Clip is not in a voting round'; end if;
  if now() < k.voting_opens or now() > k.voting_closes then raise exception 'Voting is closed'; end if;
  if exists (select 1 from public.clips where id = p_clip and owner_id = auth.uid()) then
    raise exception 'You cannot vote for your own clip'; end if;

  select * into t from public.my_tier();
  allowed := 1 + t.extra_votes;
  select count(*) into used from public.votes
   where contest_id = k.id and voter_id = auth.uid() and clip_id <> p_clip;

  if used >= allowed then
    if allowed = 1 then
      -- free members have a single vote, so a new pick moves it
      delete from public.votes where contest_id = k.id and voter_id = auth.uid();
    else
      raise exception 'OUT_OF_VOTES';
    end if;
  end if;

  insert into public.votes (contest_id, voter_id, clip_id, weight)
  values (k.id, auth.uid(), p_clip, t.vote_weight)
  on conflict (contest_id, voter_id, clip_id) do update set weight = excluded.weight;
end $$;

create or replace function public.clear_vote(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.votes v using public.clips c
   where v.clip_id = p_clip and c.id = p_clip
     and v.voter_id = auth.uid() and v.contest_id = c.contest_id;
end $$;

-- Tallies and rankings are hidden from free accounts.
create or replace function public.can_see_votes() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_paying(auth.uid()) or public.is_admin();
$$;

create or replace view public.clip_scores
with (security_invoker = true) as
  select c.*,
         case when public.can_see_votes() then coalesce(v.score, 0)::int end as votes,
         coalesce(v.score, 0)::int as score_internal
    from public.clips c
    left join (select clip_id, sum(weight) score from public.votes group by clip_id) v
           on v.clip_id = c.id;

-- Staff close-out ranks on the real weighted score, not the masked column.
create or replace function public.close_contest(p_contest uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; r record; i int := 0;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into k from public.contests where id = p_contest;
  for r in select c.id, c.owner_id, coalesce(sum(v.weight), 0) as score, c.created_at
             from public.clips c left join public.votes v on v.clip_id = c.id
            where c.contest_id = p_contest and c.status in ('approved','featured')
            group by c.id, c.owner_id, c.created_at
            order by score desc, c.created_at asc limit 3
  loop
    i := i + 1;
    insert into public.winnings (contest_id, clip_id, owner_id, place, amount_cents)
    values (p_contest, r.id, r.owner_id, i, round(k.pool_cents * k.split[i]))
    on conflict (contest_id, place) do nothing;
  end loop;
  update public.contests set status = 'closed' where id = p_contest;
  insert into public.money_events (kind, amount_cents, note)
  values ('contest_closed', k.pool_cents, k.title);
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 5. Prize pool that scales with paying members
-- ═════════════════════════════════════════════════════════════════
create or replace function public.paying_user_count() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles
   where tier <> 'street' and subscription_status in ('active','trialing');
$$;

--   0–199    $25 seed, platform funded
-- 200–499    $100
-- 500–2,499  $250 floor
-- 2,500+     $0.10 a head, fully community funded
create or replace function public.weekly_pool_cents(p_payers integer default null)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when coalesce(p_payers, public.paying_user_count()) < 200  then 2500
    when coalesce(p_payers, public.paying_user_count()) < 500  then 10000
    when coalesce(p_payers, public.paying_user_count()) < 2500 then 25000
    else coalesce(p_payers, public.paying_user_count()) * 10
  end;
$$;

create or replace function public.monthly_pool_cents() returns integer
language sql stable security definer set search_path = public as $$
  select (public.weekly_pool_cents() * (select monthly_pool_multiple from public.site_settings where id))::int;
$$;

-- Anyone may read the current pool; this is shown publicly on the site.
create or replace view public.pool_now
with (security_invoker = true) as
  select public.paying_user_count()  as paying_users,
         public.weekly_pool_cents()  as weekly_cents,
         public.monthly_pool_cents() as monthly_cents;

-- The pool is fixed when a contest opens so it cannot move under the entrants.
alter table public.contests add column if not exists kind text not null default 'weekly'
  check (kind in ('weekly','monthly'));
alter table public.contests add column if not exists payers_at_open integer;
alter table public.contests add column if not exists pool_locked_at timestamptz;

create or replace function public.open_contest(p_contest uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer; cents integer; k text;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select kind into k from public.contests where id = p_contest;
  n := public.paying_user_count();
  cents := case when k = 'monthly' then public.monthly_pool_cents() else public.weekly_pool_cents(n) end;
  update public.contests
     set pool_cents = cents, payers_at_open = n, pool_locked_at = now(), status = 'submissions'
   where id = p_contest;
  insert into public.money_events (kind, amount_cents, note)
  values ('pool_locked', cents, format('%s paying members', n));
  return cents;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 6. Freemium limits
-- ═════════════════════════════════════════════════════════════════
alter table public.clips add column if not exists duration_seconds integer;
alter table public.clips add column if not exists for_contest boolean not null default true;
alter table public.clips add column if not exists watermark_path text;
alter table public.clips add column if not exists watermark_status text not null default 'queued'
  check (watermark_status in ('queued','running','done','failed','skipped'));

-- Contest entries must be under three minutes.
create or replace function public.check_contest_length() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.for_contest and new.duration_seconds is not null and new.duration_seconds >= 180 then
    raise exception 'CLIP_TOO_LONG';
  end if;
  return new;
end $$;
drop trigger if exists clip_length_guard on public.clips;
create trigger clip_length_guard before insert or update on public.clips
  for each row execute function public.check_contest_length();

create or replace function public.submissions_today(p_user uuid default auth.uid())
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.clips
   where submitted_by = p_user and created_at >= date_trunc('day', now());
$$;

create or replace function public.can_submit() returns boolean
language sql stable security definer set search_path = public as $$
  select public.submissions_today() < (select daily_submissions from public.my_tier());
$$;

-- Enforced in the database, not just the form.
create or replace function public.check_daily_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap integer;
begin
  select daily_submissions into cap from public.tiers
   where id = case when public.is_paying(new.submitted_by) then
                (select tier from public.profiles where id = new.submitted_by) else 'street' end;
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
-- 7. In-web chat (replaces the Discord server)
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.chat_channels (
  id text primary key,
  label text not null,
  description text,
  members_only boolean not null default false,
  min_rank smallint not null default 0,     -- tier rank needed when members_only
  position smallint not null default 0,
  archived boolean not null default false
);
insert into public.chat_channels (id, label, description, members_only, min_rank, position) values
  ('lobby',    'The Lobby',   'Everyone. Say hello.',                         false, 0, 1),
  ('clips',    'Clip talk',   'This week''s round, picks and arguments.',     false, 0, 2),
  ('versus',   'Versus',      'Match calls and trash talk.',                  false, 0, 3),
  ('members',  'Members',     'Hustler and up.',                              true,  1, 4),
  ('kingpins', 'Back room',   'Kingpin and Cartel.',                          true,  2, 5)
on conflict (id) do update set label = excluded.label, description = excluded.description,
  members_only = excluded.members_only, min_rank = excluded.min_rank, position = excluded.position;

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  channel_id text not null references public.chat_channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  clip_id uuid references public.clips(id) on delete set null,   -- share a clip into chat
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_recent_idx on public.chat_messages(channel_id, created_at desc);

alter table public.chat_channels enable row level security;
alter table public.chat_messages enable row level security;

create or replace function public.can_use_channel(p_channel text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_channels c
     where c.id = p_channel and not c.archived
       and (not c.members_only
            or public.is_admin()
            or (public.is_paying(auth.uid())
                and (select rank from public.tiers where id =
                      (select tier from public.profiles where id = auth.uid())) >= c.min_rank))
  );
$$;

create policy "channels public" on public.chat_channels for select using (not archived);
create policy "channels admin" on public.chat_channels for all using (public.is_admin());
create policy "read channel messages" on public.chat_messages for select
  using (not deleted and public.can_use_channel(channel_id));
create policy "post to channel" on public.chat_messages for insert
  with check (author_id = auth.uid() and public.can_use_channel(channel_id));
create policy "edit own message" on public.chat_messages for update
  using (author_id = auth.uid() or public.is_admin());

-- Realtime fan-out for the chat pane.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
exception when undefined_object then null;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 8. Audit trail — every monetary event, append only
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.money_events (
  id bigint generated always as identity primary key,
  kind text not null,          -- subscription_started, download_paid, payout_created, …
  player_id uuid references public.profiles(id) on delete set null,
  clip_id uuid references public.clips(id) on delete set null,
  amount_cents integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists money_events_time_idx on public.money_events(created_at desc);
alter table public.money_events enable row level security;
create policy "audit own" on public.money_events for select
  using (player_id = auth.uid() or public.is_admin());

-- ═════════════════════════════════════════════════════════════════
-- 9. What the signed-in member sees about themselves
-- ═════════════════════════════════════════════════════════════════
create or replace view public.my_account
with (security_invoker = true) as
  select p.id, p.display_name, p.tier, p.billing_period, p.subscription_status,
         p.current_period_end, p.credits_remaining, t.credits_per_month,
         t.vote_weight, t.extra_votes, t.daily_submissions, t.ad_free,
         public.submissions_today(p.id) as submitted_today,
         coalesce(b.pending_cents, 0)   as pending_cents,
         coalesce(b.downloads, 0)       as lifetime_downloads
    from public.profiles p
    join public.tiers t on t.id = case when public.is_paying(p.id) then p.tier else 'street' end
    left join public.creator_balances b on b.creator_id = p.id
   where p.id = auth.uid();
