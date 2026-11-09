-- v8 – v14, applied to the live project in this order. Kept here so the repo
-- can rebuild the database. (v11, the email outbox, has its own file.)

-- ── v8: account deletion ──
alter table public.winnings drop constraint if exists winnings_owner_id_fkey;
alter table public.winnings add constraint winnings_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete set null;
create or replace function public.deletion_blockers(p_user uuid default auth.uid()) returns text[]
language sql stable security definer set search_path = public as $$
  select array_remove(array[
    case when coalesce((select sum(amount_cents) from public.wallet_entries where player_id = p_user), 0) > 0 then 'balance' end,
    case when exists (select 1 from public.profiles where id = p_user and tier <> 'free' and subscription_status in ('active','trialing','past_due')) then 'subscription' end,
    case when exists (select 1 from public.winnings where owner_id = p_user and status in ('unclaimed','requested','verifying')) then 'winnings' end
  ], null);
$$;

-- ── v9: changing your gamertag drops its verification ──
create or replace function public.reverify_on_retag() returns trigger language plpgsql set search_path = public as $$
begin
  if new.gamertag is distinct from old.gamertag then
    new.gamertag_verified := false; new.verify_code := upper(substr(md5(random()::text), 1, 6));
  end if;
  return new;
end $$;
drop trigger if exists profiles_reverify on public.profiles;
create trigger profiles_reverify before update of gamertag on public.profiles for each row execute function public.reverify_on_retag();
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid())
              and gamertag_verified <= (select gamertag_verified from public.profiles where id = auth.uid()));

-- ── v10: downloads pay the creator's wallet at once, never twice, never for buying your own ──
-- (see migration v10_downloads_pay_the_wallet: downloads.wallet_entry_id, credit_creator(),
--  download_with_credit(), record_paid_download(), owns_download(), creator_balances,
--  run_monthly_payouts() excluding wallet-credited rows)

-- ── v12: vote totals count everyone's votes, shown only to members and staff ──
create or replace function public.clip_vote_total(p_clip uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case when public.can_see_votes() or public.is_admin()
              then coalesce((select sum(weight) from public.votes where clip_id = p_clip), 0)::int end;
$$;
grant execute on function public.clip_vote_total(uuid) to anon, authenticated;
create or replace view public.clip_scores with (security_invoker = true) as
  select c.id, c.contest_id, c.owner_id, c.submitted_by, c.title, c.platform, c.gamertag, c.storage_path, c.source_url,
         c.edited_url, c.youtube_timestamp, c.status, c.reject_reason, c.created_at, c.duration_seconds, c.for_contest,
         c.watermark_path, c.watermark_status, c.drop_id, c.trending_until, public.clip_vote_total(c.id) as votes
    from public.clips c;

-- ── v13: members can't touch plan, money, rank or staff columns on their profile ──
create or replace function public.guard_profile() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.role := old.role; new.is_admin := old.is_admin; new.tier := old.tier; new.billing_period := old.billing_period;
    new.subscription_status := old.subscription_status; new.current_period_end := old.current_period_end;
    new.stripe_customer_id := old.stripe_customer_id; new.stripe_subscription_id := old.stripe_subscription_id;
    new.credits_remaining := old.credits_remaining; new.credits_reset_at := old.credits_reset_at;
    new.streak_days := old.streak_days; new.best_streak := old.best_streak; new.last_upload_on := old.last_upload_on;
    new.freezes_left := old.freezes_left; new.subscribed_since := old.subscribed_since; new.created_at := old.created_at;
    if new.gamertag is not distinct from old.gamertag then new.gamertag_verified := old.gamertag_verified; end if;
    if new.gamertag_verified and not old.gamertag_verified then new.gamertag_verified := false; end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile();

-- ── v14: a member's new clip is theirs, pending, and carries no staff-only fields ──
create or replace function public.guard_clip_insert() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') and not public.is_admin() then
    new.owner_id := auth.uid(); new.trending_until := null; new.youtube_timestamp := null;
    new.edited_url := null; new.watermark_path := null; new.reject_reason := null;
  end if;
  return new;
end $$;
drop trigger if exists clips_guard_insert on public.clips;
create trigger clips_guard_insert before insert on public.clips for each row execute function public.guard_clip_insert();

-- ── v15: prizes go to the wallet whatever their open status; the old member "request payout" path is gone ──
create or replace function public.pay_winnings_to_wallet(p_contest uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  for r in select * from public.winnings
            where contest_id = p_contest and owner_id is not null and status in ('unclaimed','requested','verifying') loop
    insert into public.wallet_entries (player_id, amount_cents, kind, note, ref, created_by)
    values (r.owner_id, r.amount_cents, 'prize', format('Place %s', r.place), r.id::text, auth.uid());
    update public.winnings set status = 'sent', sent_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
drop policy if exists "winnings request" on public.winnings;
