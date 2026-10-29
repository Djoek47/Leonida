-- Live From Leonida — Supabase schema
-- Run in Supabase SQL editor. Creates tables, RLS policies, storage bucket and voting/payout functions.

create extension if not exists "pgcrypto";

-- ───────── Profiles ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  platform text check (platform in ('ps5','xbox','pc')),
  gamertag text,                       -- typed by the user at upload time (no proof needed to upload)
  gamertag_verified boolean not null default false,  -- set by admin, or by Xbox OAuth / PSN bio code
  verify_code text default upper(substr(md5(random()::text),1,6)), -- code the user puts in PSN "About me"
  payout_method text check (payout_method in ('paypal','venmo','cashapp','interac','wise')),
  payout_handle text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Weekly contests ─────────
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,                 -- e.g. "Week 1 — Vice City Getaways"
  pool_cents integer not null default 10000,
  split numeric[] not null default '{0.5,0.3,0.2}',  -- 1st / 2nd / 3rd share of pool
  submissions_close timestamptz not null,
  voting_opens timestamptz not null,
  voting_closes timestamptz not null,
  youtube_url text,                    -- compilation video
  status text not null default 'submissions'
    check (status in ('submissions','review','voting','closed','paid')),
  created_at timestamptz not null default now()
);

-- ───────── Clips ─────────
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid references public.contests(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null, -- null = unclaimed (found by staff / uploaded by someone else)
  submitted_by uuid references public.profiles(id) on delete set null,
  title text not null,
  platform text not null check (platform in ('ps5','xbox','pc')),
  gamertag text not null,              -- whose gameplay this is
  storage_path text,                   -- uploaded file in bucket "clips"
  source_url text,                     -- or an external link (YouTube, TikTok, PS share…)
  edited_url text,                     -- staff edit (Higgsfield / FFmpeg cut)
  youtube_timestamp integer,           -- seconds into the compilation video
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','featured')),
  reject_reason text,
  created_at timestamptz not null default now()
);
create index if not exists clips_contest_idx on public.clips(contest_id, status);

-- Claims: someone says "that clip is mine"
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  evidence text,                       -- original file link, capture date, etc.
  status text not null default 'open' check (status in ('open','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (clip_id, claimant_id)
);

-- ───────── Votes: one vote per account per contest (can be moved) ─────────
create table if not exists public.votes (
  contest_id uuid not null references public.contests(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contest_id, voter_id)
);

create or replace view public.clip_scores as
  select c.*, coalesce(v.n,0)::int as votes
  from public.clips c
  left join (select clip_id, count(*) n from public.votes group by clip_id) v on v.clip_id = c.id;

create or replace function public.cast_vote(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests;
begin
  if auth.uid() is null then raise exception 'Sign in to vote'; end if;
  select ct.* into k from public.contests ct join public.clips cl on cl.contest_id = ct.id
   where cl.id = p_clip and cl.status in ('approved','featured');
  if k.id is null then raise exception 'Clip is not in a voting round'; end if;
  if now() < k.voting_opens or now() > k.voting_closes then raise exception 'Voting is closed'; end if;
  if exists (select 1 from public.clips where id = p_clip and owner_id = auth.uid())
    then raise exception 'You cannot vote for your own clip'; end if;
  insert into public.votes(contest_id, voter_id, clip_id) values (k.id, auth.uid(), p_clip)
  on conflict (contest_id, voter_id) do update set clip_id = excluded.clip_id, created_at = now();
end $$;

-- ───────── Winnings & payouts ─────────
create table if not exists public.winnings (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id),
  clip_id uuid not null references public.clips(id),
  owner_id uuid references public.profiles(id),
  place smallint not null check (place between 1 and 3),
  amount_cents integer not null,
  status text not null default 'unclaimed'
    check (status in ('unclaimed','requested','verifying','sent','held')),
  payout_ref text,                     -- PayPal/Venmo transaction id
  requested_at timestamptz, sent_at timestamptz,
  unique (contest_id, place)
);

-- Admin: close a contest and create the top-3 winnings rows
create or replace function public.close_contest(p_contest uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; r record; i int := 0;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'Admins only'; end if;
  select * into k from public.contests where id = p_contest;
  for r in select id, owner_id, votes from public.clip_scores
           where contest_id = p_contest and status in ('approved','featured')
           order by votes desc, created_at asc limit 3 loop
    i := i + 1;
    insert into public.winnings(contest_id, clip_id, owner_id, place, amount_cents)
    values (p_contest, r.id, r.owner_id, i, round(k.pool_cents * k.split[i]))
    on conflict (contest_id, place) do nothing;
  end loop;
  update public.contests set status = 'closed' where id = p_contest;
end $$;

-- ───────── Versus ─────────
create table if not exists public.versus_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,                 -- "Grand theft sprint: steal the Grotti Cheetah"
  objective text not null,
  starts_at timestamptz not null,
  twitch_url text,
  prize_cents integer not null default 0,
  status text not null default 'open' check (status in ('open','scheduled','live','done')),
  winner_id uuid references public.profiles(id)
);
create table if not exists public.versus_applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.versus_events(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null, gamertag text not null,
  can_stream boolean not null default true,  -- can share console via PS Remote Play / Xbox app / capture card
  note text,
  status text not null default 'applied' check (status in ('applied','selected','declined')),
  unique (event_id, player_id)
);

-- ───────── RLS ─────────
alter table public.profiles enable row level security;
alter table public.contests enable row level security;
alter table public.clips enable row level security;
alter table public.claims enable row level security;
alter table public.votes enable row level security;
alter table public.winnings enable row level security;
alter table public.versus_events enable row level security;
alter table public.versus_applications enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid())
              and gamertag_verified = (select gamertag_verified from public.profiles where id = auth.uid()));
create policy "admin profiles" on public.profiles for update using (public.is_admin());

create policy "contests public" on public.contests for select using (true);
create policy "contests admin" on public.contests for all using (public.is_admin());

create policy "clips public when approved" on public.clips for select
  using (status in ('approved','featured') or submitted_by = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "submit clip" on public.clips for insert with check (submitted_by = auth.uid() and status = 'pending');
create policy "clips admin" on public.clips for update using (public.is_admin());

create policy "claims own" on public.claims for select using (claimant_id = auth.uid() or public.is_admin());
create policy "claims insert" on public.claims for insert with check (claimant_id = auth.uid());
create policy "claims admin" on public.claims for update using (public.is_admin());

create policy "votes own" on public.votes for select using (voter_id = auth.uid() or public.is_admin());

create policy "winnings own" on public.winnings for select using (owner_id = auth.uid() or public.is_admin());
create policy "winnings request" on public.winnings for update using (owner_id = auth.uid() and status = 'unclaimed')
  with check (status = 'requested');
create policy "winnings admin" on public.winnings for all using (public.is_admin());

create policy "versus public" on public.versus_events for select using (true);
create policy "versus admin" on public.versus_events for all using (public.is_admin());
create policy "apply own" on public.versus_applications for select using (player_id = auth.uid() or public.is_admin());
create policy "apply insert" on public.versus_applications for insert with check (player_id = auth.uid());
create policy "apply admin" on public.versus_applications for update using (public.is_admin());

-- ───────── Storage (clip uploads, private) ─────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('clips','clips', false, 524288000) on conflict do nothing;  -- 500 MB max
create policy "upload own folder" on storage.objects for insert
  with check (bucket_id = 'clips' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own or admin" on storage.objects for select
  using (bucket_id = 'clips' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ───────── Three Comma Club ($1B GTA Online VIP Discord) ─────────
create table if not exists public.club_applications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  social_club text not null,
  proof_url text not null,          -- clip of Stats > Career + Maze Bank balance
  profile_url text not null,        -- Social Club profile screenshot showing the club code
  discord text not null,
  status text not null default 'applied' check (status in ('applied','approved','declined')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  unique (player_id)
);
alter table public.club_applications enable row level security;
create policy "club own" on public.club_applications for select using (player_id = auth.uid() or public.is_admin());
create policy "club apply" on public.club_applications for insert with check (player_id = auth.uid() and status = 'applied');
create policy "club admin" on public.club_applications for update using (public.is_admin());

-- ───────── Staff roles ─────────
alter table public.profiles add column if not exists role text not null default 'member'
  check (role in ('member','reviewer','moderator','owner'));
alter table public.profiles add column if not exists is_club boolean not null default false;

-- Only owners change roles; is_admin follows the role so existing policies keep working.
create or replace function public.set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then raise exception 'Owners only'; end if;
  update public.profiles set role = p_role, is_admin = (p_role <> 'member') where id = p_user;
end $$;

-- ───────── Site settings ─────────
create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  voting_mode text not null default 'club' check (voting_mode in ('club','everyone')),
  next_theme_options text[] not null default '{"Getaways","Stunts","Heists","Funniest fail"}'
);
insert into public.site_settings default values on conflict do nothing;
alter table public.site_settings enable row level security;
create policy "settings public" on public.site_settings for select using (true);
create policy "settings admin" on public.site_settings for update using (public.is_admin());

-- Club membership follows approval
create or replace function public.club_approved() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set is_club = (new.status = 'approved') where id = new.player_id;
  return new;
end $$;
drop trigger if exists club_status on public.club_applications;
create trigger club_status after update of status on public.club_applications for each row execute function public.club_approved();

-- ───────── Club powers ─────────
-- 1) While voting_mode = 'club', only Triple Comma Club members can vote.
create or replace function public.cast_vote(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; mode text;
begin
  if auth.uid() is null then raise exception 'Sign in to vote'; end if;
  select voting_mode into mode from public.site_settings;
  if mode = 'club' and not exists (select 1 from public.profiles where id = auth.uid() and is_club) then
    raise exception 'Voting is open to Triple Comma Club members for now';
  end if;
  select ct.* into k from public.contests ct join public.clips cl on cl.contest_id = ct.id
   where cl.id = p_clip and cl.status in ('approved','featured');
  if k.id is null then raise exception 'Clip is not in a voting round'; end if;
  if now() < k.voting_opens or now() > k.voting_closes then raise exception 'Voting is closed'; end if;
  if exists (select 1 from public.clips where id = p_clip and owner_id = auth.uid()) then raise exception 'You cannot vote for your own clip'; end if;
  insert into public.votes(contest_id, voter_id, clip_id) values (k.id, auth.uid(), p_clip)
  on conflict (contest_id, voter_id) do update set clip_id = excluded.clip_id, created_at = now();
end $$;

-- 2) Spotlight: one per member per round; pushes a pending clip to the top of staff review.
alter table public.clips add column if not exists spotlighted_by uuid references public.profiles(id);
create or replace function public.spotlight(p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c public.clips;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_club) then raise exception 'Members only'; end if;
  select * into c from public.clips where id = p_clip;
  if exists (select 1 from public.clips where contest_id = c.contest_id and spotlighted_by = auth.uid()) then
    raise exception 'You already used your spotlight this round'; end if;
  update public.clips set spotlighted_by = auth.uid() where id = p_clip and spotlighted_by is null;
end $$;

-- 3) Members pick next week's theme.
create table if not exists public.theme_votes (
  week date not null, voter_id uuid not null references public.profiles(id) on delete cascade,
  theme text not null, primary key (week, voter_id)
);
alter table public.theme_votes enable row level security;
create policy "theme read" on public.theme_votes for select using (true);
create policy "theme vote" on public.theme_votes for insert with check (
  voter_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and is_club));
create policy "theme change" on public.theme_votes for update using (voter_id = auth.uid());
