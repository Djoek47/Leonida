-- v38: public_results also returns each placer's avatar path (already public in the clips hub), for the two-sided podium coins.
-- my_round_result returns the podium avatars too. Rollback: re-run the v29 public_results and the v37 my_round_result.
create or replace function public.public_results(p_limit integer default 12) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(row order by (row->>'announced_at') desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', c.id, 'title', c.title, 'period', c.period, 'closed_at', c.voting_closes, 'announced_at', x.announced_at,
      'podium', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'place', w.place, 'amount_cents', w.amount_cents, 'clip_id', cl.id, 'clip_title', cl.title,
                 'creator', coalesce(p.display_name, 'Player'), 'gamertag', cl.gamertag, 'platform', cl.platform,
                 'avatar', p.avatar_path,
                 'path', coalesce(cl.watermark_path, cl.storage_path), 'mine', (w.owner_id = auth.uid())) order by w.place)
          from winnings w join clips cl on cl.id = w.clip_id left join profiles p on p.id = w.owner_id
         where w.contest_id = c.id), '[]'::jsonb)) as row
    from contests c join round_results x on x.contest_id = c.id and x.result_version = c.result_version
    where c.timezone is not null and x.announced_at is not null and x.outcome = 'winner'
    order by x.announced_at desc limit greatest(1, least(p_limit, 50))
  ) s
$$;
grant execute on function public.public_results(integer) to anon, authenticated;
