-- Live From Leonida — schema v4: the member wallet, and storage that lets an
-- approved clip actually be watched. Run AFTER schema-v3.sql. Safe to re-run.
--
-- Tags are NOT in this file. They are generated from src/lib/tags.ts so the
-- picker and the database can never drift:  node scripts/seed-tags.mjs

-- ═════════════════════════════════════════════════════════════════
-- 1. Wallet — a ledger, not a balance column
-- ═════════════════════════════════════════════════════════════════
-- A balance that is stored can drift from its own history. This one is the
-- sum of its entries, so it cannot. Every admin move writes a row with the
-- admin's id on it.
create table if not exists public.wallet_entries (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents <> 0),   -- negative = money out
  kind text not null check (kind in
    ('admin_credit','admin_debit','prize','clip_earning','download_earning','withdrawal','refund','adjustment')),
  note text,
  ref text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wallet_player_idx on public.wallet_entries(player_id, created_at desc);
alter table public.wallet_entries enable row level security;
drop policy if exists "wallet own" on public.wallet_entries;
create policy "wallet own" on public.wallet_entries for select
  using (player_id = auth.uid() or public.is_admin());
drop policy if exists "wallet admin" on public.wallet_entries;
create policy "wallet admin" on public.wallet_entries for all using (public.is_admin());

create or replace view public.wallet_balances with (security_invoker = true) as
  select player_id, sum(amount_cents)::int as balance_cents,
         sum(amount_cents) filter (where amount_cents > 0)::int as in_cents,
         -sum(amount_cents) filter (where amount_cents < 0)::int as out_cents,
         max(created_at) as last_movement
    from public.wallet_entries group by player_id;

create or replace function public.my_balance_cents() returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(amount_cents)::int from public.wallet_entries where player_id = auth.uid()), 0);
$$;

-- Admin tops up or takes money off. Never below zero.
create or replace function public.adjust_wallet(p_user uuid, p_cents integer, p_note text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_cents = 0 then raise exception 'AMOUNT_ZERO'; end if;
  select coalesce(sum(amount_cents),0)::int into bal from public.wallet_entries where player_id = p_user;
  if bal + p_cents < 0 then raise exception 'INSUFFICIENT_FUNDS'; end if;
  insert into public.wallet_entries (player_id, amount_cents, kind, note, created_by)
  values (p_user, p_cents, case when p_cents > 0 then 'admin_credit' else 'admin_debit' end, p_note, auth.uid());
  insert into public.money_events (kind, player_id, amount_cents, note)
  values (case when p_cents > 0 then 'wallet_credit' else 'wallet_debit' end, p_user, abs(p_cents), p_note);
  return bal + p_cents;
end $$;

-- A member asks for their balance out. Never allowed to overdraw.
create or replace function public.request_withdrawal(p_cents integer)
returns integer language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_cents <= 0 then raise exception 'AMOUNT_ZERO'; end if;
  select coalesce(sum(amount_cents),0)::int into bal from public.wallet_entries where player_id = auth.uid();
  if p_cents > bal then raise exception 'INSUFFICIENT_FUNDS'; end if;
  insert into public.wallet_entries (player_id, amount_cents, kind, note, created_by)
  values (auth.uid(), -p_cents, 'withdrawal', 'requested by member', auth.uid());
  insert into public.money_events (kind, player_id, amount_cents, note)
  values ('withdrawal_requested', auth.uid(), p_cents, null);
  return bal - p_cents;
end $$;

-- Winning a round puts the money straight in the wallet. An unclaimed win is
-- skipped and stays 'unclaimed' until someone proves the clip is theirs.
create or replace function public.pay_winnings_to_wallet(p_contest uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  for r in select * from public.winnings
            where contest_id = p_contest and owner_id is not null and status = 'unclaimed' loop
    insert into public.wallet_entries (player_id, amount_cents, kind, note, ref, created_by)
    values (r.owner_id, r.amount_cents, 'prize', format('Place %s', r.place), r.id::text, auth.uid());
    update public.winnings set status = 'sent', sent_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ═════════════════════════════════════════════════════════════════
-- 2. Storage — an approved clip has to be watchable, not just by its owner
-- ═════════════════════════════════════════════════════════════════
drop policy if exists "read approved clips" on storage.objects;
create policy "read approved clips" on storage.objects for select
  using (bucket_id = 'clips' and exists (
    select 1 from public.clips c
     where c.status in ('approved','featured')
       and (c.storage_path = storage.objects.name or c.watermark_path = storage.objects.name)));
drop policy if exists "update own upload" on storage.objects;
create policy "update own upload" on storage.objects for update
  using (bucket_id = 'clips' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own upload" on storage.objects;
create policy "delete own upload" on storage.objects for delete
  using (bucket_id = 'clips' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbs','thumbs', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "thumbs readable" on storage.objects;
create policy "thumbs readable" on storage.objects for select using (bucket_id = 'thumbs');
drop policy if exists "thumbs upload own" on storage.objects;
create policy "thumbs upload own" on storage.objects for insert
  with check (bucket_id = 'thumbs' and (storage.foldername(name))[1] = auth.uid()::text);
