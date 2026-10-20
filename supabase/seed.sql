-- Test data for trying the full flow on a fresh Supabase project. Safe to delete afterwards.
-- Run AFTER schema.sql and after you've signed in once (so your profile exists).
insert into public.contests (title, pool_cents, submissions_close, voting_opens, voting_closes, status)
values ('Test round: Vice City getaways', 10000, now() - interval '1 day', now() - interval '1 day', now() + interval '3 days', 'voting');

insert into public.clips (contest_id, title, platform, gamertag, source_url, status, youtube_timestamp)
select c.id, t.title, t.platform, t.tag, 'https://www.youtube.com/', 'approved', t.ts
from public.contests c,
  (values ('Bridge jump into the Keys','ps5','KeysKingpin',0),
          ('Airboat chase through Grassrivers','xbox','SwampSaint',38),
          ('One-take bank exit','ps5','LuciaMain',76)) as t(title, platform, tag, ts)
where c.title = 'Test round: Vice City getaways';

-- Let yourself vote while voting is club-only:
-- update public.profiles set is_club = true where id = (select id from auth.users where email = 'YOUR@EMAIL');
