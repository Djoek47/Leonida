-- v32: chat is paid-only (Street and up). Voting room added, Back room archived (messages kept).
-- Enforcement is server-side: can_use_channel() backs both RLS policies and chat_feed().
-- Rollback: update chat_channels set members_only=false,min_rank=0 where id in ('lobby','clips','trending'); update chat_channels set archived=false where id='kingpins'; delete from chat_channels where id='voting';
insert into public.chat_channels (id, label, description, members_only, min_rank, position, archived) values
  ('lobby',    'The Lobby',   'Everyone. Say hello.',                       true, 1, 1, false),
  ('clips',    'Clip talk',   'This week''s round, picks and arguments.',   true, 1, 2, false),
  ('voting',   'Voting',      'Talk through this week''s vote.',            true, 1, 3, false),
  ('trending', 'Trending',    'Daily Drop winners and what''s climbing.',   true, 1, 4, false),
  ('members',  'Members',     'Street, Hustler and Kingpin.',               true, 1, 5, false)
on conflict (id) do update set label=excluded.label, description=excluded.description,
  members_only=excluded.members_only, min_rank=excluded.min_rank, position=excluded.position, archived=excluded.archived;
update public.chat_channels set archived = true where id = 'kingpins';
