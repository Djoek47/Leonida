-- v42: withdrawing a clip. Votes and views are wiped, the clip leaves the site and the competition,
-- and only people who already downloaded it keep it, with a library to re-download from.
drop function if exists public.withdraw_my_clip(uuid, text);
create or replace function public.withdraw_my_clip(p_clip uuid, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k public.clips; v int; w int; buyers int;
begin
  select * into k from public.clips where id = p_clip and (owner_id = auth.uid() or submitted_by = auth.uid()) for update;
  if k.id is null then raise exception 'NOT_YOURS'; end if;
  select count(distinct downloader_id)::int into buyers from public.downloads where clip_id = p_clip;
  if k.status = 'withdrawn' then
    return jsonb_build_object('already', true, 'votes_removed', 0, 'views_removed', 0, 'keep_access', buyers);
  end if;
  if exists (select 1 from public.winnings where clip_id = p_clip) then raise exception 'ALREADY_PLACED'; end if;
  if k.contest_id is not null and exists (select 1 from public.contests where id = k.contest_id and voting_closes <= now()) then
    raise exception 'ROUND_CLOSED';
  end if;
  select count(*)::int into v from public.votes where clip_id = p_clip;
  w := coalesce(k.view_count, 0);
  delete from public.votes where clip_id = p_clip;
  delete from public.clip_views where clip_id = p_clip;
  update public.clips
     set view_count = 0, for_contest = false, contest_id = null, status = 'withdrawn',
         moderation_note = p_reason, moderated_at = now(), moderated_by = auth.uid()
   where id = p_clip;
  insert into public.clip_moderation (clip_id, actor_id, action, note)
  values (p_clip, auth.uid(), 'member_withdrew', format('votes_removed=%s views_removed=%s keep_access=%s %s', v, w, buyers, coalesce(p_reason, '')));
  return jsonb_build_object('votes_removed', v, 'views_removed', w, 'keep_access', buyers);
end $$;
grant execute on function public.withdraw_my_clip(uuid, text) to authenticated;
revoke all on function public.withdraw_my_clip(uuid, text) from anon;

-- How many people already own a clip, for the withdraw warning. Owner only.
create or replace function public.my_clip_buyers(p_clip uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(distinct d.downloader_id)::int from public.downloads d join public.clips c on c.id = d.clip_id
   where d.clip_id = p_clip and (c.owner_id = auth.uid() or c.submitted_by = auth.uid())
$$;
grant execute on function public.my_clip_buyers(uuid) to authenticated;
revoke all on function public.my_clip_buyers(uuid) from anon;

-- The buyer's own library (the existing my_downloaded_clips only returns ids): everything downloaded, including clips since withdrawn by the creator.
create or replace function public.my_download_library() returns table(
  clip_id uuid, title text, gamertag text, platform text, withdrawn boolean, downloaded_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.gamertag, c.platform, (c.status = 'withdrawn'), max(d.created_at)
    from public.downloads d join public.clips c on c.id = d.clip_id
   where d.downloader_id = auth.uid() and c.status in ('approved', 'featured', 'withdrawn')
   group by c.id, c.title, c.gamertag, c.platform, c.status
   order by max(d.created_at) desc
$$;
grant execute on function public.my_download_library() to authenticated;
revoke all on function public.my_download_library() from anon;
