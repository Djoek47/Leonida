-- v11: the email outbox. Every event worth an email writes one row here, in
-- the same transaction as the event itself, so an email exists if and only if
-- the thing happened. pg_net pings the site once the row commits; the site
-- sends it through Resend and marks it. Rows that fail stay queued.
create extension if not exists pg_net with schema extensions;
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.email_config (
  id boolean primary key default true check (id),
  flush_url text not null,
  secret text not null
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  data jsonb not null default '{}',
  dedupe text unique,
  status text not null default 'pending' check (status in ('pending','sending','sent','skipped')),
  attempts smallint not null default 0,
  error text, resend_id text,
  created_at timestamptz not null default now(), sent_at timestamptz
);
create index if not exists email_outbox_pending on public.email_outbox (created_at) where status = 'pending';
alter table public.email_outbox enable row level security;
create policy "outbox admin" on public.email_outbox for select using (public.is_admin());

create or replace function public.enqueue_email(p_user uuid, p_kind text, p_data jsonb, p_dedupe text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.email_outbox (user_id, kind, data, dedupe) values (p_user, p_kind, coalesce(p_data,'{}'), p_dedupe)
  on conflict (dedupe) do nothing;
end $$;
revoke all on function public.enqueue_email(uuid, text, jsonb, text) from anon, authenticated;

-- Hand out a batch; stale 'sending' rows (a crashed run) come back after 10 min.
create or replace function public.claim_email_batch(p_limit int)
returns setof public.email_outbox language sql security definer set search_path = public as $$
  update public.email_outbox o set status = 'sending', attempts = attempts + 1
   where o.id in (select id from public.email_outbox
                   where (status = 'pending' or (status = 'sending' and created_at < now() - interval '10 minutes'))
                     and attempts < 6 order by created_at limit p_limit for update skip locked)
  returning o.*;
$$;
revoke all on function public.claim_email_batch(int) from anon, authenticated;

create or replace function public.ping_email_flush() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare c private.email_config;
begin
  select * into c from private.email_config where id;
  if c.flush_url is not null then
    perform net.http_post(url := c.flush_url, body := '{}'::jsonb,
      headers := jsonb_build_object('content-type','application/json','x-flush-secret', c.secret));
  end if;
  return null;
end $$;
drop trigger if exists email_outbox_ping on public.email_outbox;
create trigger email_outbox_ping after insert on public.email_outbox
  for each statement execute function public.ping_email_flush();

-- ── Events ──
create or replace function public.mail_on_profile() returns trigger
language plpgsql security definer set search_path = public as $$
declare amt int; perks int;
begin
  if new.tier is distinct from old.tier then
    if coalesce(old.tier,'free') = 'free' and new.tier <> 'free' then
      select case when new.billing_period = 'annual' then annual_cents else monthly_cents end into amt from public.tiers where id = new.tier;
      perform public.enqueue_email(new.id, 'plan_started', jsonb_build_object(
        'tier', new.tier, 'period', coalesce(new.billing_period,'monthly'), 'amount', amt,
        'credits', new.credits_remaining, 'renews', new.current_period_end,
        'test', current_setting('app.mock', true) = '1'), 'plan:' || new.id || ':' || txid_current());
    elsif new.tier = 'free' then
      perform public.enqueue_email(new.id, 'plan_ended', jsonb_build_object('from', old.tier), 'plan:' || new.id || ':' || txid_current());
    else
      perform public.enqueue_email(new.id, 'plan_changed', jsonb_build_object('from', old.tier, 'to', new.tier), 'plan:' || new.id || ':' || txid_current());
    end if;
  end if;
  if new.gamertag_verified and not coalesce(old.gamertag_verified,false) then
    perform public.enqueue_email(new.id, 'gamertag_verified', jsonb_build_object('gamertag', new.gamertag, 'platform', new.platform), 'gt:' || new.id || ':' || coalesce(new.gamertag,''));
  end if;
  return new;
end $$;
drop trigger if exists profiles_mail on public.profiles;
create trigger profiles_mail after update on public.profiles for each row execute function public.mail_on_profile();

-- Placement badges are covered by the prize email, so only the others mail.
create or replace function public.mail_on_badge() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.badges; nx public.badges; total int;
begin
  if new.badge ~ '_(gold|silver|bronze)$' then return new; end if;
  select * into b from public.badges where id = new.badge;
  select count(*) into total from public.clips where submitted_by = new.player_id;
  select * into nx from public.badges where clips_needed > coalesce(b.clips_needed, 1e9) order by clips_needed limit 1;
  perform public.enqueue_email(new.player_id, 'badge_earned', jsonb_build_object('label', b.label, 'blurb', b.blurb,
    'next', nx.label, 'toGo', case when nx.id is null then null else nx.clips_needed - total end), 'badge:' || new.player_id || ':' || new.badge);
  return new;
end $$;
drop trigger if exists earned_badges_mail on public.earned_badges;
create trigger earned_badges_mail after insert on public.earned_badges for each row execute function public.mail_on_badge();

create or replace function public.mail_on_winning() returns trigger
language plpgsql security definer set search_path = public as $$
declare k public.contests; t text;
begin
  if new.owner_id is null or (tg_op = 'UPDATE' and old.owner_id is not null) then return new; end if;
  select * into k from public.contests where id = new.contest_id;
  select title into t from public.clips where id = new.clip_id;
  perform public.enqueue_email(new.owner_id, 'prize_won', jsonb_build_object('place', new.place, 'amount', new.amount_cents,
    'period', k.period, 'contest', k.title, 'title', t), 'win:' || new.id);
  return new;
end $$;
drop trigger if exists winnings_mail on public.winnings;
create trigger winnings_mail after insert or update of owner_id on public.winnings for each row execute function public.mail_on_winning();

create or replace function public.mail_on_wallet() returns trigger
language plpgsql security definer set search_path = public as $$
declare bal int; pr public.profiles; w public.winnings;
begin
  select coalesce(sum(amount_cents),0)::int into bal from public.wallet_entries where player_id = new.player_id;
  if new.kind = 'download_earning' then
    perform public.enqueue_email(new.player_id, 'clip_sold', jsonb_build_object('amount', new.amount_cents, 'title', new.note, 'balance', bal), 'wallet:' || new.id);
  elsif new.kind = 'prize' then
    select * into w from public.winnings where id::text = new.ref;
    perform public.enqueue_email(new.player_id, 'prize_paid', jsonb_build_object('amount', new.amount_cents, 'place', w.place, 'balance', bal), 'wallet:' || new.id);
  elsif new.kind = 'withdrawal' then
    select * into pr from public.profiles where id = new.player_id;
    perform public.enqueue_email(new.player_id, 'withdrawal_requested', jsonb_build_object('amount', -new.amount_cents,
      'method', pr.payout_method, 'handle', pr.payout_handle, 'balance', bal), 'wallet:' || new.id);
  elsif new.kind = 'admin_credit' then
    perform public.enqueue_email(new.player_id, 'wallet_credit', jsonb_build_object('amount', new.amount_cents, 'note', new.note, 'balance', bal), 'wallet:' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists wallet_entries_mail on public.wallet_entries;
create trigger wallet_entries_mail after insert on public.wallet_entries for each row execute function public.mail_on_wallet();

create or replace function public.mail_on_download() returns trigger
language plpgsql security definer set search_path = public as $$
declare cl public.clips;
begin
  if new.charged_cents <= 0 then return new; end if;
  select * into cl from public.clips where id = new.clip_id;
  perform public.enqueue_email(new.downloader_id, 'download_receipt', jsonb_build_object('amount', new.charged_cents,
    'creator', new.creator_cents, 'title', cl.title, 'gamertag', cl.gamertag, 'clip', cl.id), 'dl:' || new.id);
  return new;
end $$;
drop trigger if exists downloads_mail on public.downloads;
create trigger downloads_mail after insert on public.downloads for each row execute function public.mail_on_download();

create or replace function public.mail_on_payout() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sent' and old.status is distinct from 'sent' then
    perform public.enqueue_email(new.creator_id, 'payout_sent', jsonb_build_object('amount', new.amount_cents,
      'method', new.method, 'handle', new.handle, 'reference', new.reference), 'payout:' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists payouts_mail on public.payouts;
create trigger payouts_mail after update on public.payouts for each row execute function public.mail_on_payout();

-- v11b: plan_started reads perks from the tier row and flags test-mode upgrades.
-- (applied as migration v11b_plan_started_details; see the live function)
-- The flush URL and secret go into private.email_config by hand, never in git:
--   insert into private.email_config (flush_url, secret) values ('https://www.livefromleonida.com/api/email/flush', '<EMAIL_FLUSH_SECRET>');
