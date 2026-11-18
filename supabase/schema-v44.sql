-- v44: Resubmission rules (Contest Rules, Nov 17 2026)
--
-- * A clip that has won a weekly or monthly prize can never be submitted again.
-- * A clip that has not won can be resubmitted into the next open weekly round the member picks.
--   It counts toward that round's allowance, goes back to "pending" and is reviewed again.
-- * Enforced here, not only in the UI. Run after v43.

-- 1. Has this clip ever won a weekly or monthly prize? (winnings rows exist only for paid top-three places.)
create or replace function public.clip_has_won(p_clip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from winnings w join contests k on k.id = w.contest_id
     where w.clip_id = p_clip and k.kind in ('weekly','monthly')
  )
$$;
grant execute on function public.clip_has_won(uuid) to authenticated;

-- 2. Resubmit one of your own clips to an open weekly round.
create or replace function public.resubmit_clip(p_clip uuid, p_contest uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c clips; cur contests; k contests; cap int; used int;
begin
  if me is null then raise exception 'NOT_ALLOWED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('upload:' || me::text, 0));
  select * into c from clips where id = p_clip for update;
  if c.id is null or c.owner_id is distinct from me then raise exception 'NOT_FOUND'; end if;

  if public.clip_has_won(c.id) then raise exception 'CLIP_ALREADY_WON'; end if;
  if c.status = 'withdrawn' then raise exception 'CLIP_WITHDRAWN'; end if;

  -- Still live in a round that hasn't finished: nothing to resubmit yet.
  if c.status in ('pending','approved','featured') and c.contest_id is not null then
    select * into cur from contests where id = c.contest_id;
    if cur.id is not null and cur.status not in ('closed','paid') and cur.voting_closes > now() then
      raise exception 'ALREADY_IN_ROUND';
    end if;
  end if;

  select * into k from contests where id = p_contest;
  if k.id is null or k.kind <> 'weekly' or k.status in ('closed','paid') or k.submissions_close < now() then
    raise exception 'ROUND_CLOSED';
  end if;
  if c.contest_id = k.id then raise exception 'ALREADY_IN_ROUND'; end if;

  cap := coalesce(tier_allowance(me), 2);
  select count(*) into used from upload_slots where user_id = me and contest_id = k.id;
  if used >= cap then raise exception 'WEEKLY_LIMIT'; end if;

  perform set_config('app.entering_round', '1', true);
  update clips set contest_id = k.id, for_contest = true, status = 'pending',
         moderated_by = null, moderated_at = null, reject_reason = null
   where id = c.id;
  insert into upload_slots (user_id, clip_id, week_start, contest_id)
  values (me, c.id, upload_week_start(k.voting_opens), k.id);
  return jsonb_build_object('id', c.id, 'contest_id', k.id, 'status', 'pending');
end $$;
revoke all on function public.resubmit_clip(uuid, uuid) from public, anon;
grant execute on function public.resubmit_clip(uuid, uuid) to authenticated;
