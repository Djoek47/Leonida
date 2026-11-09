-- Live From Leonida — schema v7: close the vote-tally leak, and feed the
-- stream overlays. Run AFTER schema-v6.sql. Safe to re-run.

-- can_see_votes() masks clip_scores.votes for free accounts, and then
-- score_internal sat beside it holding the same number with no mask at all.
-- Anyone with the publishable key could read exact tallies off the REST API.
-- Nothing in the app ever used it, so it goes.
drop view if exists public.clip_scores;
create view public.clip_scores with (security_invoker = true) as
  select c.*, case when public.can_see_votes() then coalesce(v.score, 0)::int end as votes
    from public.clips c
    left join (select clip_id, sum(weight) score from public.votes group by clip_id) v
           on v.clip_id = c.id;

-- ═════════════════════════════════════════════════════════════════
-- Stream overlays
-- ═════════════════════════════════════════════════════════════════
-- OBS loads a browser source with no session, so it cannot be a signed-in
-- member — but the standings it shows are exactly the numbers we keep from
-- free accounts. A token in the URL stands in for the sign-in. It lives in
-- site_settings so it can be rotated without a deploy.
alter table public.site_settings
  add column if not exists overlay_token text not null default encode(gen_random_bytes(16), 'hex');

create or replace function public.rotate_overlay_token() returns text
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  update public.site_settings set overlay_token = t where id;
  return t;
end $$;

create or replace function public.overlay_top(p_token text, p_limit integer default 10)
returns table (place integer, clip_id uuid, title text, gamertag text,
               platform text, votes integer, trending boolean)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by coalesce(v.score, 0) desc, c.created_at)::int,
         c.id, c.title, c.gamertag, c.platform,
         coalesce(v.score, 0)::int,
         (c.trending_until > now())
    from public.clips c
    left join (select clip_id, sum(weight) score from public.votes group by clip_id) v
           on v.clip_id = c.id
   where c.status in ('approved','featured')
     and c.contest_id = (select id from public.contests
                          where status in ('voting','review','submissions')
                          order by voting_closes desc limit 1)
     and exists (select 1 from public.site_settings
                  where id and overlay_token = p_token and length(coalesce(p_token,'')) >= 16)
   order by 1
   limit greatest(1, least(50, p_limit));
$$;

create or replace function public.overlay_round(p_token text)
returns table (title text, pool_cents integer, gold_cents integer,
               paying_users integer, voting_closes timestamptz, status text)
language sql stable security definer set search_path = public as $$
  select c.title, (public.bracket_for()).pool_cents, (public.bracket_for()).gold_cents,
         public.paying_user_count(), c.voting_closes, c.status
    from public.contests c
   where exists (select 1 from public.site_settings
                  where id and overlay_token = p_token and length(coalesce(p_token,'')) >= 16)
     and c.status in ('voting','review','submissions')
   order by c.voting_closes desc limit 1;
$$;

revoke all on function public.rotate_overlay_token() from anon, authenticated;
grant execute on function public.overlay_top(text, integer) to anon, authenticated;
grant execute on function public.overlay_round(text)        to anon, authenticated;
