-- v34: trophy engine. 3 Podium trophies + 80 retention trophies (8 categories x 10). Achievements only: no cash, votes or credits.
-- Evaluated on the server from canonical records; unique(user_id, trophy_id) makes awards idempotent.
-- Rollback: drop table user_trophies, trophy_defs cascade; drop functions trophy_metrics, evaluate_trophies, my_trophies, ack_trophies, public_trophies, trophy_sweep and the trg_trophy_* triggers.
create table if not exists public.trophy_defs (
  id text primary key, category text not null, name text not null, description text not null, metric text not null,
  threshold bigint not null, privacy text not null check (privacy in ('public','private')), icon text, version int not null default 1,
  active boolean not null default true, sort int not null default 0);
create table if not exists public.user_trophies (
  user_id uuid not null references public.profiles(id) on delete cascade, trophy_id text not null references public.trophy_defs(id),
  earned_at timestamptz not null default now(), def_version int not null default 1, source text not null default 'live',
  evidence jsonb, seen_at timestamptz, primary key (user_id, trophy_id));
alter table public.trophy_defs enable row level security; alter table public.user_trophies enable row level security;
create policy "defs public" on public.trophy_defs for select using (true);
create policy "own trophies" on public.user_trophies for select using (user_id = auth.uid() or public.is_admin());

insert into public.trophy_defs (id, category, name, description, metric, threshold, privacy, sort) values
  ('podium_weekly','Podium','Weekly Prize Winner','First finalized, announced weekly prize at Gold, Silver or Bronze.','podium_week',1,'public',1),
  ('podium_monthly','Podium','Monthly Prize Winner','First finalized, announced monthly prize at any prize-paying rank.','podium_month',1,'public',2),
  ('podium_yearly','Podium','Yearly Prize Winner','First finalized, announced yearly prize at any prize-paying rank.','podium_year',1,'public',3),
  ('V01','Audience','First Crowd','Total valid views: 100 views.','views',100,'public',10),
  ('V02','Audience','Neighborhood Buzz','Total valid views: 500 views.','views',500,'public',11),
  ('V03','Audience','Four-Digit Fame','Total valid views: 1,000 views.','views',1000,'public',12),
  ('V04','Audience','Local Legend','Total valid views: 5,000 views.','views',5000,'public',13),
  ('V05','Audience','Leonida Spotlight','Total valid views: 10,000 views.','views',10000,'public',14),
  ('V06','Audience','Citywide Signal','Total valid views: 25,000 views.','views',25000,'public',15),
  ('V07','Audience','Crowd Magnet','Total valid views: 50,000 views.','views',50000,'public',16),
  ('V08','Audience','Six-Figure Audience','Total valid views: 100,000 views.','views',100000,'public',17),
  ('V09','Audience','Statewide Sensation','Total valid views: 500,000 views.','views',500000,'public',18),
  ('V10','Audience','Million-View Monarch','Total valid views: 1,000,000 views.','views',1000000,'public',19),
  ('E01','Earnings','First Dollar','Money made: 1 dollars earned.','earnings_cents',100,'private',20),
  ('E02','Earnings','Five on the Board','Money made: 5 dollars earned.','earnings_cents',500,'private',21),
  ('E03','Earnings','Ten-Dollar Talent','Money made: 10 dollars earned.','earnings_cents',1000,'private',22),
  ('E04','Earnings','Quarter-Century Cash','Money made: 25 dollars earned.','earnings_cents',2500,'private',23),
  ('E05','Earnings','Fifty Earned','Money made: 50 dollars earned.','earnings_cents',5000,'private',24),
  ('E06','Earnings','Hundred Club','Money made: 100 dollars earned.','earnings_cents',10000,'private',25),
  ('E07','Earnings','Creator Payday','Money made: 250 dollars earned.','earnings_cents',25000,'private',26),
  ('E08','Earnings','Half-Grand Hustle','Money made: 500 dollars earned.','earnings_cents',50000,'private',27),
  ('E09','Earnings','Four-Figure Creator','Money made: 1,000 dollars earned.','earnings_cents',100000,'private',28),
  ('E10','Earnings','Five-Grand Legacy','Money made: 5,000 dollars earned.','earnings_cents',500000,'private',29),
  ('D01','Downloads','First Takeaway','Creator clips downloaded: 1 downloads.','downloads',1,'public',30),
  ('D02','Downloads','Five Worth Keeping','Creator clips downloaded: 5 downloads.','downloads',5,'public',31),
  ('D03','Downloads','Download Decade','Creator clips downloaded: 10 downloads.','downloads',10,'public',32),
  ('D04','Downloads','Saved Around Town','Creator clips downloaded: 25 downloads.','downloads',25,'public',33),
  ('D05','Downloads','Pocket Collection','Creator clips downloaded: 50 downloads.','downloads',50,'public',34),
  ('D06','Downloads','Hundred Keepsakes','Creator clips downloaded: 100 downloads.','downloads',100,'public',35),
  ('D07','Downloads','Clip Collector''s Choice','Creator clips downloaded: 250 downloads.','downloads',250,'public',36),
  ('D08','Downloads','Five Hundred Saves','Creator clips downloaded: 500 downloads.','downloads',500,'public',37),
  ('D09','Downloads','Thousand Downloads','Creator clips downloaded: 1,000 downloads.','downloads',1000,'public',38),
  ('D10','Downloads','Leonida Essential','Creator clips downloaded: 5,000 downloads.','downloads',5000,'public',39),
  ('U01','Uploads','First Broadcast','Approved published clips: 1 approved clips.','uploads',1,'public',40),
  ('U02','Uploads','Three-Clip Start','Approved published clips: 3 approved clips.','uploads',3,'public',41),
  ('U03','Uploads','Five on Film','Approved published clips: 5 approved clips.','uploads',5,'public',42),
  ('U04','Uploads','Ten Takes','Approved published clips: 10 approved clips.','uploads',10,'public',43),
  ('U05','Uploads','Quarter-Reel Creator','Approved published clips: 25 approved clips.','uploads',25,'public',44),
  ('U06','Uploads','Fifty Frames','Approved published clips: 50 approved clips.','uploads',50,'public',45),
  ('U07','Uploads','Century Clipper','Approved published clips: 100 approved clips.','uploads',100,'public',46),
  ('U08','Uploads','Leonida Archive','Approved published clips: 250 approved clips.','uploads',250,'public',47),
  ('U09','Uploads','Five-Hundred Reel','Approved published clips: 500 approved clips.','uploads',500,'public',48),
  ('U10','Uploads','Thousand-Clip Legacy','Approved published clips: 1,000 approved clips.','uploads',1000,'public',49),
  ('F01','Featuring','First Spotlight','Activated feature placements: 1 feature placements.','features',1,'public',50),
  ('F02','Featuring','Double Exposure','Activated feature placements: 2 feature placements.','features',2,'public',51),
  ('F03','Featuring','Triple Spotlight','Activated feature placements: 3 feature placements.','features',3,'public',52),
  ('F04','Featuring','Feature Regular','Activated feature placements: 5 feature placements.','features',5,'public',53),
  ('F05','Featuring','Ten in Lights','Activated feature placements: 10 feature placements.','features',10,'public',54),
  ('F06','Featuring','Spotlight Circuit','Activated feature placements: 15 feature placements.','features',15,'public',55),
  ('F07','Featuring','Featured Fixture','Activated feature placements: 25 feature placements.','features',25,'public',56),
  ('F08','Featuring','Fifty Features','Activated feature placements: 50 feature placements.','features',50,'public',57),
  ('F09','Featuring','Leonida Headliner','Activated feature placements: 75 feature placements.','features',75,'public',58),
  ('F10','Featuring','Spotlight Century','Activated feature placements: 100 feature placements.','features',100,'public',59),
  ('R01','Votes received','First Supporter','Valid lifetime votes received: 1 votes received.','votes_received',1,'private',60),
  ('R02','Votes received','Five Cheers','Valid lifetime votes received: 5 votes received.','votes_received',5,'private',61),
  ('R03','Votes received','Ten Voices','Valid lifetime votes received: 10 votes received.','votes_received',10,'private',62),
  ('R04','Votes received','Community Spark','Valid lifetime votes received: 25 votes received.','votes_received',25,'private',63),
  ('R05','Votes received','Fifty Backers','Valid lifetime votes received: 50 votes received.','votes_received',50,'private',64),
  ('R06','Votes received','Hundred Cheers','Valid lifetime votes received: 100 votes received.','votes_received',100,'private',65),
  ('R07','Votes received','Crowd Favorite','Valid lifetime votes received: 250 votes received.','votes_received',250,'private',66),
  ('R08','Votes received','Five-Hundred Salute','Valid lifetime votes received: 500 votes received.','votes_received',500,'private',67),
  ('R09','Votes received','Thousand Voices','Valid lifetime votes received: 1,000 votes received.','votes_received',1000,'private',68),
  ('R10','Votes received','Leonida Acclaim','Valid lifetime votes received: 5,000 votes received.','votes_received',5000,'private',69),
  ('G01','Votes given','First Say','Accepted lifetime votes given: 1 votes given.','votes_given',1,'private',70),
  ('G02','Votes given','Three Good Calls','Accepted lifetime votes given: 3 votes given.','votes_given',3,'private',71),
  ('G03','Votes given','Five Picks','Accepted lifetime votes given: 5 votes given.','votes_given',5,'private',72),
  ('G04','Votes given','Ten Selections','Accepted lifetime votes given: 10 votes given.','votes_given',10,'private',73),
  ('G05','Votes given','Talent Scout','Accepted lifetime votes given: 25 votes given.','votes_given',25,'private',74),
  ('G06','Votes given','Community Curator','Accepted lifetime votes given: 50 votes given.','votes_given',50,'private',75),
  ('G07','Votes given','Hundred Decisions','Accepted lifetime votes given: 100 votes given.','votes_given',100,'private',76),
  ('G08','Votes given','Leonida Tastemaker','Accepted lifetime votes given: 250 votes given.','votes_given',250,'private',77),
  ('G09','Votes given','Five-Hundred Picks','Accepted lifetime votes given: 500 votes given.','votes_given',500,'private',78),
  ('G10','Votes given','Thousand-Clip Judge','Accepted lifetime votes given: 1,000 votes given.','votes_given',1000,'private',79),
  ('P01','Return participation','First Week in Leonida','Distinct active weeks: 1 active weeks.','active_weeks',1,'public',80),
  ('P02','Return participation','Back for More','Distinct active weeks: 2 active weeks.','active_weeks',2,'public',81),
  ('P03','Return participation','Four-Week Familiar','Distinct active weeks: 4 active weeks.','active_weeks',4,'public',82),
  ('P04','Return participation','Eight-Week Regular','Distinct active weeks: 8 active weeks.','active_weeks',8,'public',83),
  ('P05','Return participation','Seasoned Local','Distinct active weeks: 12 active weeks.','active_weeks',12,'public',84),
  ('P06','Return participation','Twenty-Week Citizen','Distinct active weeks: 20 active weeks.','active_weeks',20,'public',85),
  ('P07','Return participation','Half-Year Contributor','Distinct active weeks: 26 active weeks.','active_weeks',26,'public',86),
  ('P08','Return participation','Leonida Mainstay','Distinct active weeks: 39 active weeks.','active_weeks',39,'public',87),
  ('P09','Return participation','Year of Contributions','Distinct active weeks: 52 active weeks.','active_weeks',52,'public',88),
  ('P10','Return participation','Two-Year Legacy','Distinct active weeks: 104 active weeks.','active_weeks',104,'public',89)
on conflict (id) do update set name = excluded.name, description = excluded.description, metric = excluded.metric,
  threshold = excluded.threshold, privacy = excluded.privacy, sort = excluded.sort;

create or replace function public.trophy_metrics(u uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with ann as (
    select w.*, c.period from winnings w join contests c on c.id = w.contest_id
      join round_results x on x.contest_id = c.id and x.result_version = c.result_version and x.announced_at is not null
     where w.owner_id = u),
  wk as (
    select contest_id from clips where owner_id = u and contest_id is not null and status in ('approved','featured') and published_at is not null
    union select contest_id from votes where voter_id = u
    union select ct.id from clips cl join contests ct on ct.kind = 'weekly' and cl.created_at between ct.voting_closes - interval '7 days' and ct.voting_closes
      where cl.owner_id = u and cl.drop_id is not null)
  select jsonb_build_object(
    'views', coalesce((select sum(view_count) from clips where owner_id = u and status in ('approved','featured') and published_at is not null), 0),
    'earnings_cents', coalesce((select sum(creator_cents) from downloads where creator_id = u and downloader_id <> u), 0)
                    + coalesce((select sum(amount_cents) from ann), 0),
    'downloads', (select count(*) from downloads where creator_id = u and downloader_id <> u),
    'uploads', (select count(*) from clips where owner_id = u and status in ('approved','featured') and published_at is not null),
    'features', (select count(*) from featured_placements where member_id = u and status not in ('failed','queued','cancelled','pending','refused') and coalesce(source,'') not ilike '%drop%'),
    'votes_received', (select count(distinct (v.voter_id, v.clip_id)) from votes v join clips c on c.id = v.clip_id where c.owner_id = u and v.voter_id <> u),
    'votes_given', (select count(distinct clip_id) from votes where voter_id = u),
    'active_weeks', (select count(*) from wk where contest_id is not null),
    'podium_week', (select count(*) from ann where period = 'week' and place between 1 and 3),
    'podium_month', (select count(*) from ann where period = 'month' and place between 1 and 3),
    'podium_year', (select count(*) from ann where period = 'year' and place between 1 and 3))
$$;
revoke all on function public.trophy_metrics(uuid) from public, anon, authenticated;

create or replace function public.evaluate_trophies(u uuid, p_source text default 'live') returns integer
language plpgsql security definer set search_path = public as $$
declare m jsonb; n int;
begin
  m := trophy_metrics(u);
  with ins as (
    insert into user_trophies (user_id, trophy_id, def_version, source, evidence, seen_at)
    select u, d.id, d.version, p_source, jsonb_build_object('metric', d.metric, 'value', (m->>d.metric)::bigint),
           case when p_source = 'backfill' then now() end
      from trophy_defs d where d.active and coalesce((m->>d.metric)::bigint, 0) >= d.threshold
    on conflict (user_id, trophy_id) do nothing returning 1)
  select count(*) into n from ins;
  return n;
end $$;
revoke all on function public.evaluate_trophies(uuid, text) from public, anon, authenticated;

create or replace function public.my_trophies() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m jsonb;
begin
  if u is null then return '[]'::jsonb; end if;
  perform evaluate_trophies(u, 'live');
  m := trophy_metrics(u);
  return coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'category', d.category, 'name', d.name, 'description', d.description,
      'threshold', d.threshold, 'privacy', d.privacy, 'progress', least(coalesce((m->>d.metric)::bigint,0), d.threshold),
      'earned_at', t.earned_at, 'seen_at', t.seen_at) order by d.sort)
    from trophy_defs d left join user_trophies t on t.trophy_id = d.id and t.user_id = u where d.active), '[]'::jsonb);
end $$;
grant execute on function public.my_trophies() to authenticated;

create or replace function public.ack_trophies() returns void
language sql security definer set search_path = public as $$
  update user_trophies set seen_at = now() where user_id = auth.uid() and seen_at is null
$$;
grant execute on function public.ack_trophies() to authenticated;

-- Public showcase: earned trophies from public categories only.
create or replace function public.public_trophies(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'category', d.category, 'name', d.name, 'earned_at', t.earned_at) order by d.sort), '[]'::jsonb)
    from user_trophies t join trophy_defs d on d.id = t.trophy_id where t.user_id = p_user and d.privacy = 'public'
$$;
grant execute on function public.public_trophies(uuid) to anon, authenticated;

-- Event hooks (trusted rows only) and a daily sweep for views and announced prizes.
create or replace function public.trg_trophy_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'downloads' then perform evaluate_trophies(new.creator_id);
  elsif tg_table_name = 'votes' then perform evaluate_trophies(new.voter_id); perform evaluate_trophies((select owner_id from clips where id = new.clip_id));
  elsif tg_table_name = 'clips' then perform evaluate_trophies(new.owner_id);
  elsif tg_table_name = 'featured_placements' then perform evaluate_trophies(new.member_id);
  end if;
  return new;
exception when others then return new;  -- a trophy hiccup must never block a download, vote or upload
end $$;
drop trigger if exists trg_trophy_dl on public.downloads;
create trigger trg_trophy_dl after insert on public.downloads for each row execute function public.trg_trophy_owner();
drop trigger if exists trg_trophy_vote on public.votes;
create trigger trg_trophy_vote after insert on public.votes for each row execute function public.trg_trophy_owner();
drop trigger if exists trg_trophy_clip on public.clips;
create trigger trg_trophy_clip after update of status, published_at on public.clips for each row when (new.published_at is not null) execute function public.trg_trophy_owner();
drop trigger if exists trg_trophy_feat on public.featured_placements;
create trigger trg_trophy_feat after insert on public.featured_placements for each row execute function public.trg_trophy_owner();

create or replace function public.trophy_sweep() returns integer language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from profiles loop n := n + evaluate_trophies(r.id, 'live'); end loop;
  return n;
end $$;
revoke all on function public.trophy_sweep() from public, anon, authenticated;

-- Backfill from trusted records. Quiet: backfilled awards are created already seen. Views/downloads are only what the records hold.
do $$ declare r record; begin for r in select id from profiles loop perform evaluate_trophies(r.id, 'backfill'); end loop; end $$;
