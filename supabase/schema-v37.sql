-- v37: results mail for everyone in a round, and the personal results reveal.
-- Winners: prize_won now carries contest_id and the field size. Everyone else with a clip in the round
-- gets round_result (muteable under "Rounds"). Vote totals never go into either email.
-- Rollback: restore mail_on_winning and publish_results from the live definitions before v37; drop function my_round_result.
create or replace function public.mail_on_winning() returns trigger
language plpgsql security definer set search_path = public as $$
declare k public.contests; t text; n int;
begin
  if new.owner_id is null or (tg_op = 'UPDATE' and old.owner_id is not null) then return new; end if;
  select * into k from public.contests where id = new.contest_id;
  select title into t from public.clips where id = new.clip_id;
  select count(*) into n from public.clips where contest_id = new.contest_id and for_contest;
  perform public.enqueue_email(new.owner_id, 'prize_won', jsonb_build_object('place', new.place, 'amount', new.amount_cents,
    'period', k.period, 'contest', k.title, 'title', t, 'contest_id', k.id, 'entries', n), 'win:' || new.id);
  return new;
end $$;

create or replace function public.mail_round_participants(p_contest uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare k public.contests; n int; pod jsonb; r record; made int := 0;
begin
  select * into k from contests where id = p_contest;
  select count(*) into n from clips where contest_id = p_contest and for_contest;
  select coalesce(jsonb_agg(jsonb_build_object('place', w.place, 'title', cl.title, 'creator', coalesce(p.display_name, 'Player')) order by w.place), '[]'::jsonb)
    into pod from winnings w join clips cl on cl.id = w.clip_id left join profiles p on p.id = w.owner_id where w.contest_id = p_contest;
  for r in
    select distinct on (cl.owner_id) cl.owner_id, cl.title, cl.view_count
      from clips cl
     where cl.contest_id = p_contest and cl.for_contest and cl.owner_id is not null
       and not exists (select 1 from winnings w where w.contest_id = p_contest and w.owner_id = cl.owner_id)
     order by cl.owner_id, cl.view_count desc
  loop
    perform enqueue_email(r.owner_id, 'round_result', jsonb_build_object('contest', k.title, 'contest_id', k.id, 'title', r.title,
      'views', r.view_count, 'entries', n, 'podium', pod), 'result:' || p_contest || ':' || r.owner_id);
    made := made + 1;
  end loop;
  return made;
end $$;
revoke all on function public.mail_round_participants(uuid) from public, anon, authenticated;

create or replace function public.publish_results() returns integer
language plpgsql security definer set search_path = public as $function$
declare k record; rr record; e jsonb; i int; cut int[]; mult int; made int := 0; cl record;
begin
  for k in select c.* from contests c join round_results x on x.contest_id = c.id and x.result_version = c.result_version
            where c.timezone is not null and c.state = 'finalized' and x.announced_at is null
              and c.voting_closes + interval '1 hour' <= now() for update of c loop
    select * into rr from round_results where contest_id = k.id and result_version = k.result_version;
    mult := case k.period when 'year' then 20 when 'month' then 4 else 1 end;
    select array[gold_cents * mult, silver_cents * mult, bronze_cents * mult]
      into cut from public.bracket_for(coalesce(k.payers_at_open, public.paying_user_count()));
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
end $function$;

-- The signed-in member's own result for one announced round (or their latest). Place and prize if they won;
-- otherwise their best clip's views and the field size. No vote totals.
create or replace function public.my_round_result(p_contest uuid default null) returns jsonb
language sql stable security definer set search_path = public as $$
  with c as (
    select k.id, k.title, k.period, x.announced_at from contests k
      join round_results x on x.contest_id = k.id and x.result_version = k.result_version and x.announced_at is not null
     where (p_contest is null and exists (select 1 from clips where contest_id = k.id and owner_id = auth.uid() and for_contest)) or k.id = p_contest
     order by x.announced_at desc limit 1)
  select case when auth.uid() is null or c.id is null then null else jsonb_build_object(
    'contest_id', c.id, 'round', c.title, 'period', c.period, 'announced_at', c.announced_at,
    'entries', (select count(*) from clips where contest_id = c.id and for_contest),
    'win', (select jsonb_build_object('id', w.id, 'place', w.place, 'amount_cents', w.amount_cents, 'status', w.status, 'clip_title', cl.title)
              from winnings w join clips cl on cl.id = w.clip_id where w.contest_id = c.id and w.owner_id = auth.uid() order by w.place limit 1),
    'mine', (select jsonb_build_object('title', cl.title, 'views', cl.view_count, 'path', coalesce(cl.watermark_path, cl.storage_path))
               from clips cl where cl.contest_id = c.id and cl.owner_id = auth.uid() and cl.for_contest order by cl.view_count desc limit 1),
    'podium', (select coalesce(jsonb_agg(jsonb_build_object('place', w.place, 'title', cl.title, 'creator', coalesce(p.display_name, 'Player')) order by w.place), '[]'::jsonb)
                 from winnings w join clips cl on cl.id = w.clip_id left join profiles p on p.id = w.owner_id where w.contest_id = c.id)) end
  from (select 1) one left join c on true
$$;
grant execute on function public.my_round_result(uuid) to authenticated;
