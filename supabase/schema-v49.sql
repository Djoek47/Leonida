-- Live From Leonida — schema v49: the Kingpin clip archive.
-- Every clip from a week whose voting has closed, with its placement and votes, browsable by
-- week. Kingpin (active, trialing, past_due) and admins only — same rule as the download route.

create or replace function public.is_kingpin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from profiles p where p.id = auth.uid() and p.tier = 'kingpin'
       and p.subscription_status in ('active','trialing','past_due'));
$$;

-- One row per closed week: entries, podium state, and the winner.
create or replace function public.archive_weeks()
returns table(contest_id uuid, title text, closed_at timestamptz, entries bigint, finalized boolean,
              winner_clip uuid, winner_title text, winner_gamertag text, winner_owner uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_kingpin() then raise exception 'KINGPIN_ONLY'; end if;
  return query
  select k.id, k.title, k.voting_closes,
         (select count(*) from clips c where c.contest_id = k.id and c.status in ('approved','featured')),
         k.state = 'finalized',
         wc.id, wc.title, wc.gamertag, wc.owner_id
    from contests k
    left join round_results r on r.contest_id = k.id and r.result_version = k.result_version and k.state = 'finalized'
    left join clips wc on wc.id = r.winning_clip
   where k.voting_closes < now()
     and exists (select 1 from clips c where c.contest_id = k.id and c.status in ('approved','featured'))
   order by k.voting_closes desc
   limit 200;
end $$;

-- Every archived clip. p_sort: 'place' (default, podium first), 'new', 'views', 'votes'.
create or replace function public.archive_clips(p_contest uuid default null, p_q text default null,
  p_sort text default 'place', p_limit int default 24, p_offset int default 0)
returns table(id uuid, owner_id uuid, title text, gamertag text, platform text, duration_seconds int,
              view_count int, watermark_path text, storage_path text, source_url text,
              contest_id uuid, contest_title text, closed_at timestamptz, place int, votes int, total bigint)
language plpgsql stable security definer set search_path = public as $$
declare t text := nullif(trim(coalesce(p_q, '')), '');
begin
  if not public.is_kingpin() then raise exception 'KINGPIN_ONLY'; end if;
  return query
  with ranked as (
    select (e.v->>'clip')::uuid clip, e.n::int rk, coalesce((e.v->>'votes')::int, 0) vts
      from contests k
      join round_results r on r.contest_id = k.id and r.result_version = k.result_version
      cross join lateral jsonb_array_elements(r.tally) with ordinality e(v, n)
     where k.state = 'finalized' and k.voting_closes < now()
  ), base as (
    select c.id, c.owner_id, c.title, c.gamertag, c.platform::text, c.duration_seconds, c.view_count,
           c.watermark_path, c.storage_path, c.source_url, k.id kid, k.title ktitle, k.voting_closes,
           case when rk.rk <= 3 and rk.vts > 0 then rk.rk end place, coalesce(rk.vts, 0) vts
      from clips c
      join contests k on k.id = c.contest_id
      left join ranked rk on rk.clip = c.id
     where k.voting_closes < now()
       and c.status in ('approved','featured')
       and (p_contest is null or k.id = p_contest)
       and (t is null or c.title ilike '%' || t || '%' or c.gamertag ilike '%' || t || '%')
  )
  select b.id, b.owner_id, b.title, b.gamertag, b.platform, b.duration_seconds, b.view_count,
         b.watermark_path, b.storage_path, b.source_url, b.kid, b.ktitle, b.voting_closes, b.place, b.vts,
         count(*) over ()
    from base b
   order by
     case when coalesce(p_sort,'place') = 'place' then coalesce(b.place, 99) end,
     case when p_sort = 'views' then b.view_count end desc nulls last,
     case when p_sort in ('votes','place') or p_sort is null then b.vts end desc,
     b.voting_closes desc, b.view_count desc nulls last, b.id
   limit least(greatest(p_limit, 1), 60) offset greatest(p_offset, 0);
end $$;

revoke all on function public.is_kingpin(), public.archive_weeks(), public.archive_clips(uuid, text, text, int, int) from public, anon;
grant execute on function public.is_kingpin(), public.archive_weeks(), public.archive_clips(uuid, text, text, int, int) to authenticated;
