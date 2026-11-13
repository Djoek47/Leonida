-- v29: results are frozen at Thursday noon and published at 1:00 p.m. Eastern.
-- Podium (top three), tie-break by the creators' lifetime valid views, public RESULT feed,
-- and a one-time "you won" prompt for winners.

alter table public.winnings add column if not exists seen_at timestamptz;

create or replace function public.finalize_round(p_contest uuid) returns text
language plpgsql security definer set search_path = public as $$
declare k contests; t jsonb; n int; outcome text; review boolean := false; r record;
begin
  select * into k from contests where id = p_contest for update;
  if k.id is null or k.timezone is null then return 'skip'; end if;
  if now() < k.voting_closes then return 'not_closed'; end if;
  if k.state in ('finalized','result_review') then return k.state; end if;

  -- freeze: valid votes cast before the close, then the creator's lifetime valid views as the tie-break
  create temporary table _tally on commit drop as
    select c.id as clip, c.owner_id,
           (select count(*) from votes x where x.clip_id = c.id and x.contest_id = k.id and x.created_at < k.voting_closes)::int as votes,
           (select coalesce(sum(o.view_count), 0) from clips o where o.owner_id = c.owner_id and o.status in ('approved','featured'))::int as views
      from clips c where c.contest_id = k.id and c.for_contest and c.status in ('approved','featured');
  select count(*) into n from _tally;
  select coalesce(jsonb_agg(jsonb_build_object('clip', clip, 'votes', votes, 'views', views) order by votes desc, views desc, clip), '[]')
    into t from _tally;

  if n = 0 then outcome := 'no_entries';
  elsif (select max(votes) from _tally) = 0 then outcome := 'review_all_zero';
  else
    -- a rank in the top three that cannot be separated by votes then views goes to review, never to an earliest-upload fallback
    for r in select votes, views, row_number() over (order by votes desc, views desc, clip) rk,
                    lead(votes) over (order by votes desc, views desc, clip) nv, lead(views) over (order by votes desc, views desc, clip) nw
               from _tally loop
      if r.rk <= 3 and r.votes > 0 and r.nv = r.votes and r.nw = r.views then review := true; end if;
    end loop;
    outcome := case when review then 'review_tie' else 'winner' end;
  end if;
  drop table if exists _tally;

  insert into round_results (contest_id, result_version, winning_clip, outcome, tally)
    values (k.id, k.result_version + 1, case when outcome = 'winner' then (t->0->>'clip')::uuid end, outcome, t)
    on conflict do nothing;
  update contests set result_version = k.result_version + 1,
    state = case when outcome like 'review%' then 'result_review' else 'finalized' end,
    status = 'closed' where id = k.id;
  return outcome;
end $$;

-- 1:00 p.m.: hand out the podium prizes and badges for rounds frozen at noon.
create or replace function public.publish_results() returns integer
language plpgsql security definer set search_path = public as $$
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
    made := made + 1;
  end loop;
  return made;
end $$;
revoke all on function public.publish_results() from anon, authenticated;

create or replace function public.round_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; out jsonb := '[]';
begin
  perform ensure_weekly_rounds(2);
  perform notify_round_open();
  for r in select id from contests where timezone is not null and voting_closes <= now()
             and coalesce(state,'') not in ('finalized','result_review') order by voting_closes loop
    out := out || jsonb_build_object('round', r.id, 'outcome', finalize_round(r.id));
  end loop;
  out := out || jsonb_build_object('published', publish_results());
  return out;
end $$;

-- Public feed of announced results. No vote totals, no owner ids, no payment details.
create or replace function public.public_results(p_limit integer default 12) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(row order by (row->>'announced_at') desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', c.id, 'title', c.title, 'period', c.period, 'closed_at', c.voting_closes, 'announced_at', x.announced_at,
      'podium', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'place', w.place, 'amount_cents', w.amount_cents, 'clip_id', cl.id, 'clip_title', cl.title,
                 'creator', coalesce(p.display_name, 'Player'), 'gamertag', cl.gamertag, 'platform', cl.platform,
                 'path', coalesce(cl.watermark_path, cl.storage_path), 'mine', (w.owner_id = auth.uid())) order by w.place)
          from winnings w join clips cl on cl.id = w.clip_id left join profiles p on p.id = w.owner_id
         where w.contest_id = c.id), '[]'::jsonb)) as row
    from contests c join round_results x on x.contest_id = c.id and x.result_version = c.result_version
    where c.timezone is not null and x.announced_at is not null and x.outcome = 'winner'
    order by x.announced_at desc limit greatest(1, least(p_limit, 50))
  ) s
$$;
grant execute on function public.public_results(integer) to anon, authenticated;

-- When the next result lands: the round that is voting now announces an hour after it closes.
create or replace function public.next_announcement() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('title', title, 'announce_at', voting_closes + interval '1 hour', 'closes_at', voting_closes)
                     from contests where timezone is not null and kind = 'weekly'
                      and voting_closes + interval '1 hour' > now() order by voting_closes limit 1), 'null'::jsonb)
$$;
grant execute on function public.next_announcement() to anon, authenticated;

-- The member's own newest prize that they have not seen yet.
create or replace function public.my_unseen_win() returns jsonb
language sql stable security definer set search_path = public as $$
  select (select jsonb_build_object('id', w.id, 'place', w.place, 'amount_cents', w.amount_cents, 'status', w.status,
            'round', c.title, 'period', c.period, 'clip_title', cl.title, 'announced_at', x.announced_at)
            from winnings w join contests c on c.id = w.contest_id
            join round_results x on x.contest_id = c.id and x.result_version = c.result_version and x.announced_at is not null
            join clips cl on cl.id = w.clip_id
           where w.owner_id = auth.uid() and w.seen_at is null order by x.announced_at desc limit 1)
$$;
grant execute on function public.my_unseen_win() to authenticated;

create or replace function public.ack_win(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update winnings set seen_at = now() where id = p_id and owner_id = auth.uid() and seen_at is null
$$;
grant execute on function public.ack_win(uuid) to authenticated;

-- Existing prizes were already announced: nobody gets a late "you won" for them.
update public.winnings set seen_at = now() where seen_at is null;
