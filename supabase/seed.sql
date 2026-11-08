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

-- Give yourself a paid tier for testing:
-- update public.profiles set tier = 'kingpin', subscription_status = 'active' where id = (select id from auth.users where email = 'YOUR@EMAIL');


-- ───────── A week of Daily Drops to start with ─────────
insert into public.daily_drops (day, theme, blurb, closes_at) values
  (current_date,     'Five-star escapes',   'Lose them in under a minute.',              current_date + 1),
  (current_date + 1, 'Best custom build',   'Show what you did at Rideout or Willie''s.', current_date + 2),
  (current_date + 2, 'Worst possible crash','The one you did not walk away from.',        current_date + 3),
  (current_date + 3, 'Golden hour',         'Leonida at its prettiest.',                  current_date + 4),
  (current_date + 4, 'NPC of the week',     'A stranger doing something unrepeatable.',   current_date + 5),
  (current_date + 5, 'Heist gone wrong',    'The plan held until it did not.',            current_date + 6),
  (current_date + 6, 'Airborne',            'Anything that should not have left the ground.', current_date + 7)
on conflict (day) do nothing;
