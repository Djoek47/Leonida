-- v33: Daily Clips category (Today / Last hour), six sort orders, all sorted and paged on the server.
-- Vote totals are used for ordering only and are never returned.
-- Rollback: recreate the previous 6-argument browse_clips from the live definition before this migration (p_cat week/all/featured, sort views/new).
drop function if exists public.browse_clips(text, text, text, text[], integer, integer);
create or replace function public.browse_clips(p_cat text, p_section text default null, p_sort text default 'new_desc',
  p_tags text[] default null, p_limit integer default 24, p_offset integer default 0, p_window text default null)
returns table(id uuid, contest_id uuid, owner_id uuid, title text, platform text, gamertag text, storage_path text, watermark_path text,
  source_url text, duration_seconds integer, view_count integer, published_at timestamptz, created_at timestamptz, trending_until timestamptz,
  tags text[], winner boolean, votable boolean, featured_until timestamptz, total bigint, owner_tier text, owner_avatar text)
language plpgsql stable security definer set search_path to 'public' as $function$
declare tz text; cur uuid; today_start timestamptz; srt text; since timestamptz;
begin
  if p_cat not in ('week','all','featured','daily') then raise exception 'BAD_CATEGORY'; end if;
  srt := case p_sort when 'views' then 'views_desc' when 'new' then 'new_desc' else p_sort end;
  if srt not in ('views_desc','views_asc','votes_desc','votes_asc','new_desc','new_asc') then raise exception 'BAD_SORT'; end if;
  select platform_timezone into tz from site_settings limit 1; tz := coalesce(tz, 'America/Toronto');
  today_start := make_timestamptz(extract(year from (now() at time zone tz))::int, extract(month from (now() at time zone tz))::int,
                                  extract(day from (now() at time zone tz))::int, 0, 0, 0, tz);
  since := case when p_window = 'hour' then now() - interval '1 hour' else today_start end;
  select ct.id into cur from contests ct where ct.kind='weekly' and now() >= ct.voting_opens and now() < ct.voting_closes
    order by ct.voting_opens desc limit 1;
  return query
  with base as (
    select c.*, (select max(fp.ends_at) from featured_placements fp where fp.clip_id = c.id and fp.status in ('active','scheduled')
                  and fp.starts_at <= now() and now() < fp.ends_at) as feat_end,
           array(select ct2.tag from clip_tags ct2 where ct2.clip_id = c.id order by ct2.tag limit 3) as tg,
           (select count(*) from clip_views v where v.clip_id = c.id and v.viewed_at > now() - interval '24 hours') as v24,
           (select coalesce(sum(vt.weight),0) from votes vt where vt.clip_id = c.id) as vsum
      from clips c
     where c.status in ('approved','featured') and c.published_at is not null
       and (p_cat <> 'week' or (c.contest_id = cur and c.for_contest))
       and (p_cat <> 'daily' or c.published_at >= since)
  ), f as (
    select * from base b
     where (p_cat <> 'featured' or b.feat_end is not null)
       and (p_section is distinct from 'featured' or (b.feat_end is not null and p_cat = 'week'))
       and (p_section is distinct from 'trending' or b.v24 > 0 or b.trending_until > now())
       and (p_tags is null or cardinality(p_tags) = 0 or exists (select 1 from clip_tags x where x.clip_id = b.id and x.tag = any(p_tags)))
  )
  select f.id, f.contest_id, f.owner_id, f.title, f.platform, f.gamertag, f.storage_path, f.watermark_path, f.source_url,
         f.duration_seconds, f.view_count, f.published_at, f.created_at, f.trending_until, f.tg,
         exists (select 1 from winner_badges w where w.clip_id = f.id),
         (f.for_contest and voting_open(f.contest_id)), f.feat_end, count(*) over (),
         case when pr.subscription_status in ('active','trialing') then pr.tier::text else 'free' end,
         pr.avatar_path
    from f left join profiles pr on pr.id = f.owner_id
   order by
     case when p_section = 'trending' then (f.trending_until > now())::int end desc nulls last,
     case when p_section = 'trending' then f.v24 end desc nulls last,
     case when srt = 'views_desc' and p_section is distinct from 'trending' then f.view_count end desc nulls last,
     case when srt = 'views_asc'  and p_section is distinct from 'trending' then f.view_count end asc nulls last,
     case when srt = 'votes_desc' and p_section is distinct from 'trending' then f.vsum end desc nulls last,
     case when srt = 'votes_asc'  and p_section is distinct from 'trending' then f.vsum end asc nulls last,
     case when srt = 'new_asc' then f.published_at end asc nulls last,
     case when srt <> 'new_asc' then f.published_at end desc nulls last,
     f.id desc
   limit least(greatest(p_limit,1),60) offset greatest(p_offset,0);
end $function$;
grant execute on function public.browse_clips(text,text,text,text[],integer,integer,text) to anon, authenticated;
