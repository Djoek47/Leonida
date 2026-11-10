-- v22–v25: gamertag proof (two ways), and the Console's own reads.
--
-- A clip pays whoever owns the gamertag in it, so the tag has to be proved.
-- There are two honest ways to do that and people differ in which is quicker:
--   code  — we hand out a short code; they put it in the platform profile
--           bio, a field only the account owner can write.
--   photo — they send a picture of the screen signed in as that tag. For a
--           clear photo this is the fastest check there is, which matters
--           when a lot of people arrive at once.
-- Either way a human looks before any money moves. Members may only ask;
-- the decision is staff-only and lives in decide_gamertag.
--
-- The console reads through three security-definer functions rather than
-- selecting tables directly: each one checks is_admin() itself, so a member
-- calling them gets nothing back, whatever the client does.

-- ── v22: the proof columns, and who may change them ────────────────────────
alter table public.profiles
  add column if not exists verify_method text check (verify_method in ('code','photo')),
  add column if not exists verify_photo_path text,
  add column if not exists verify_status text not null default 'none'
     check (verify_status in ('none','pending','approved','rejected')),
  add column if not exists verify_note text,
  add column if not exists verify_decided_at timestamptz;

create or replace function public.guard_profile()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.role := old.role; new.is_admin := old.is_admin; new.tier := old.tier; new.billing_period := old.billing_period;
    new.subscription_status := old.subscription_status; new.current_period_end := old.current_period_end;
    new.stripe_customer_id := old.stripe_customer_id; new.stripe_subscription_id := old.stripe_subscription_id;
    new.credits_remaining := old.credits_remaining; new.credits_reset_at := old.credits_reset_at;
    new.streak_days := old.streak_days; new.best_streak := old.best_streak; new.last_upload_on := old.last_upload_on;
    new.freezes_left := old.freezes_left; new.subscribed_since := old.subscribed_since; new.created_at := old.created_at;
    new.bonus_votes := old.bonus_votes; new.starter_claimed_at := old.starter_claimed_at;
    new.stripe_connect_id := old.stripe_connect_id; new.stripe_connect_ready := old.stripe_connect_ready;
    new.verify_note := old.verify_note; new.verify_decided_at := old.verify_decided_at;
    if new.gamertag is not distinct from old.gamertag then new.gamertag_verified := old.gamertag_verified; end if;
    if new.gamertag_verified and not old.gamertag_verified then new.gamertag_verified := false; end if;
    -- a member can put themselves in the queue, and nothing else
    if new.verify_status is distinct from old.verify_status
       and new.verify_status not in ('pending','none') then
      new.verify_status := old.verify_status;
    end if;
  end if;
  return new;
end $$;

-- The staff decision, in one call: flag, note, and the email that tells them.
create or replace function public.decide_gamertag(p_user uuid, p_ok boolean, p_note text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin() then raise exception 'NOT_STAFF'; end if;
  update public.profiles
     set verify_status = case when p_ok then 'approved' else 'rejected' end,
         gamertag_verified = p_ok,
         verify_note = p_note,
         verify_decided_at = now()
   where id = p_user;
  insert into public.email_outbox (user_id, kind, data, dedupe)
  values (p_user,
          case when p_ok then 'gamertag_approved' else 'gamertag_rejected' end,
          jsonb_build_object('note', p_note),
          'gt-' || p_user::text || '-' || extract(epoch from now())::bigint::text)
  on conflict do nothing;
end $$;
revoke all on function public.decide_gamertag(uuid, boolean, text) from public;
grant execute on function public.decide_gamertag(uuid, boolean, text) to authenticated;

-- ── v22: the console's front page, in one round trip ───────────────────────
create or replace function public.console_stats()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not public.is_admin() then '{}'::jsonb else jsonb_build_object(
    'clips_pending',    (select count(*) from clips where status = 'pending'),
    'clips_today',      (select count(*) from clips where created_at >= date_trunc('day', now())),
    'clips_week',       (select count(*) from clips where created_at >= now() - interval '7 days'),
    'clips_approved',   (select count(*) from clips where status = 'approved'),
    'gamertags_pending',(select count(*) from profiles where verify_status = 'pending'),
    'claims_open',      (select count(*) from claims where status = 'open'),
    'members',          (select count(*) from profiles),
    'members_new_week', (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'payers',           (select count(*) from profiles where tier <> 'free' and subscription_status = 'active'),
    'votes_today',      (select count(*) from votes where created_at >= date_trunc('day', now())),
    'votes_week',       (select count(*) from votes where created_at >= now() - interval '7 days'),
    'downloads_today',  (select count(*) from downloads where created_at >= date_trunc('day', now())),
    'downloads_week',   (select count(*) from downloads where created_at >= now() - interval '7 days'),
    'sales_week_cents', (select coalesce(sum(charged_cents),0) from downloads where created_at >= now() - interval '7 days'),
    'owed_creators_cents', (select coalesce(sum(pending_cents),0) from creator_balances),
    'wallets_cents',    (select coalesce(sum(amount_cents),0) from wallet_entries),
    'prizes_waiting',   (select count(*) from winnings where status in ('requested','verifying','held')),
    'pool',             (select to_jsonb(p) from pool_now p limit 1),
    'contest',          (select jsonb_build_object('id', id, 'title', title, 'status', status,
                                 'pool_cents', pool_cents, 'voting_closes', voting_closes)
                           from contests order by created_at desc limit 1)
  ) end;
$$;
revoke all on function public.console_stats() from public;
grant execute on function public.console_stats() to authenticated;

-- ── v23: everyone, with what they have left to spend ───────────────────────
create or replace function public.console_people(p_q text default null, p_limit int default 60)
returns table (
  id uuid, display_name text, gamertag text, platform text, gamertag_verified boolean,
  verify_status text, role text, tier text, subscription_status text, billing_period text,
  credits_remaining int, credits_per_month int, votes_allowed int, votes_used int,
  daily_submissions int, submitted_today int, streak_days int,
  wallet_cents int, pending_cents int, lifetime_downloads bigint, clips int, created_at timestamptz
) language sql stable security definer set search_path to 'public' as $$
  select p.id, p.display_name, p.gamertag, p.platform, p.gamertag_verified,
         p.verify_status, p.role, p.tier, p.subscription_status, p.billing_period,
         p.credits_remaining, t.credits_per_month,
         (t.votes + coalesce(p.bonus_votes,0))::int as votes_allowed,
         (select count(*) from votes v
            where v.voter_id = p.id
              and v.contest_id = (select id from contests order by created_at desc limit 1))::int as votes_used,
         t.daily_submissions::int, submissions_today(p.id)::int, p.streak_days,
         (select coalesce(sum(amount_cents),0)::int from wallet_entries w where w.player_id = p.id),
         coalesce(b.pending_cents,0), coalesce(b.downloads,0),
         (select count(*) from clips c where c.owner_id = p.id)::int,
         p.created_at
    from profiles p
    join tiers t on t.id = case when is_paying(p.id) then p.tier else 'free' end
    left join creator_balances b on b.creator_id = p.id
   where public.is_admin()
     and (p_q is null or p_q = ''
          or p.display_name ilike '%'||p_q||'%'
          or p.gamertag    ilike '%'||p_q||'%'
          or p.id::text = p_q)
   order by p.created_at desc
   limit greatest(1, least(p_limit, 200));
$$;
revoke all on function public.console_people(text, int) from public;
grant execute on function public.console_people(text, int) to authenticated;

-- ── v23: the gamertag queue, oldest first ──────────────────────────────────
create or replace function public.console_gamertag_queue()
returns table (
  id uuid, display_name text, gamertag text, platform text,
  verify_method text, verify_photo_path text, verify_code text,
  requested_at timestamptz, clips int
) language sql stable security definer set search_path to 'public' as $$
  select p.id, p.display_name, p.gamertag, p.platform,
         p.verify_method, p.verify_photo_path, p.verify_code,
         p.verify_requested_at,
         (select count(*) from clips c where c.owner_id = p.id)::int
    from profiles p
   where public.is_admin() and p.verify_status = 'pending'
   order by p.verify_requested_at nulls last;
$$;
revoke all on function public.console_gamertag_queue() from public;
grant execute on function public.console_gamertag_queue() to authenticated;

-- ── v24: where proof photos live ───────────────────────────────────────────
-- Private bucket. A member writes only under their own id and reads only
-- their own; staff read everything. The path check in
-- request_gamertag_check means nobody can point us at someone else's file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gamertags', 'gamertags', false, 10485760, array['image/png','image/jpeg','image/webp','image/heic'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types, public = false;

drop policy if exists "gt proof in" on storage.objects;
create policy "gt proof in" on storage.objects for insert to authenticated
  with check (bucket_id = 'gamertags' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "gt proof read" on storage.objects;
create policy "gt proof read" on storage.objects for select to authenticated
  using (bucket_id = 'gamertags' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "gt proof replace" on storage.objects;
create policy "gt proof replace" on storage.objects for update to authenticated
  using (bucket_id = 'gamertags' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── v25: asking for a check ────────────────────────────────────────────────
-- The no-argument form is kept so older clients keep working.
create or replace function public.request_gamertag_check()
returns void language sql security definer set search_path to 'public' as $$
  update public.profiles
     set verify_requested_at = now(), verify_status = 'pending',
         verify_method = coalesce(verify_method, 'code'), verify_note = null
   where id = auth.uid() and gamertag is not null and not gamertag_verified;
$$;

create or replace function public.request_gamertag_check(p_method text, p_photo text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if p_method not in ('code','photo') then raise exception 'BAD_METHOD'; end if;
  -- a photo must be one of theirs, not a path they typed in
  if p_method = 'photo' and (p_photo is null or split_part(p_photo, '/', 1) <> auth.uid()::text) then
    raise exception 'BAD_PHOTO';
  end if;
  update public.profiles
     set verify_method = p_method,
         verify_photo_path = case when p_method = 'photo' then p_photo else verify_photo_path end,
         verify_status = 'pending',
         verify_requested_at = now(),
         verify_note = null
   where id = auth.uid()
     and gamertag is not null and gamertag <> '';
  if not found then raise exception 'NO_GAMERTAG'; end if;
end $$;
revoke all on function public.request_gamertag_check(text, text) from public;
grant execute on function public.request_gamertag_check(text, text) to authenticated;

-- A changed tag is a new claim: the old proof stops counting the moment the
-- tag moves, so nobody can get verified on one tag and then swap in another.
create or replace function public.reset_verify_on_tag_change()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.gamertag is distinct from old.gamertag or new.platform is distinct from old.platform then
    new.gamertag_verified := false;
    new.verify_status := 'none';
    new.verify_requested_at := null;
    new.verify_photo_path := null;
  end if;
  return new;
end $$;
create or replace trigger reset_verify_on_tag_change before update on public.profiles
  for each row execute function public.reset_verify_on_tag_change();

-- Bring the rows that predate all this into line with it.
update public.profiles set verify_status = 'pending', verify_method = coalesce(verify_method, 'code')
 where verify_requested_at is not null and not gamertag_verified and verify_status = 'none';
update public.profiles set verify_status = 'approved' where gamertag_verified and verify_status <> 'approved';
