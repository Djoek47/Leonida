-- Clip Market: players sell their own clips for $1–$20. The video stays locked until bought;
-- buyers judge it by five screenshots, a description and a chat with the seller.
-- Every listing is reviewed by an admin before it goes live. Sales credit the seller's wallet
-- (price minus our fee) once Stripe confirms the payment.

-- Fee and limits, editable by admins. Default: 20% with a 50¢ floor (covers Stripe on a $1 sale).
create table if not exists public.market_settings (
  id boolean primary key default true check (id),
  fee_bps int not null default 2000 check (fee_bps between 0 and 5000),
  min_fee_cents int not null default 50 check (min_fee_cents between 0 and 500),
  max_bytes bigint not null default 5368709120,
  min_price_cents int not null default 100,
  max_price_cents int not null default 2000
);
insert into public.market_settings (id) values (true) on conflict do nothing;
alter table public.market_settings enable row level security;
drop policy if exists market_settings_read on public.market_settings;
create policy market_settings_read on public.market_settings for select using (true);
drop policy if exists market_settings_admin on public.market_settings;
create policy market_settings_admin on public.market_settings for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.market_fee(p_price int) returns int language sql stable as $$
  select least(p_price, greatest(s.min_fee_cents, round(p_price * s.fee_bps / 10000.0)::int)) from public.market_settings s where s.id
$$;

create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(title) between 3 and 80),
  description text not null check (length(description) between 20 and 2000),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 5),
  tags text[] not null check (cardinality(tags) between 1 and 4 and tags <@ array['driving','funny','npc','dangerous','scary','money','action','shootout','chase','heist','stunt','scenic']),
  emblem text not null check (emblem = any(array['driving','funny','npc','dangerous','scary','money','action','shootout','chase','heist','stunt','scenic'])),
  theme text not null check (theme = any(array['vice_city','leonida_keys','grassrivers','port_gellhorn','ambrosia','mount_kalaga_national_park'])),
  price_cents int not null check (price_cents between 100 and 2000),
  duration_s int check (duration_s > 0),
  size_bytes bigint check (size_bytes > 0),
  width int, height int,
  storage_path text,
  shots text[] not null check (cardinality(shots) = 5),
  status text not null default 'pending' check (status in ('uploading','pending','live','rejected','paused','removed')),
  review_note text,
  sales_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists market_live on public.market_listings (status, created_at desc);
create index if not exists market_seller on public.market_listings (seller_id, created_at desc);
alter table public.market_listings enable row level security;
drop policy if exists market_read on public.market_listings;
create policy market_read on public.market_listings for select using (status = 'live' or seller_id = auth.uid() or public.is_admin());
drop policy if exists market_insert on public.market_listings;
create policy market_insert on public.market_listings for insert with check (seller_id = auth.uid());
drop policy if exists market_update on public.market_listings;
create policy market_update on public.market_listings for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
-- The file path is never readable from the browser; downloads go through the server.
revoke select on public.market_listings from anon, authenticated;
grant select (id, seller_id, title, description, highlights, tags, emblem, theme, price_cents, duration_s, size_bytes, width, height,
  shots, status, review_note, sales_count, created_at, updated_at, approved_at) on public.market_listings to anon, authenticated;

-- Sellers can't approve themselves. They may pause/relist a live clip or take it down;
-- changing the screenshots or the file sends it back to review.
create or replace function public.market_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_admin() or auth.uid() is null then
    if new.status = 'live' and (tg_op = 'INSERT' or old.status <> 'live') then new.approved_at := now(); end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status not in ('uploading','pending') then new.status := 'uploading'; end if;
    new.sales_count := 0; new.review_note := null; new.approved_at := null;
    return new;
  end if;
  new.seller_id := old.seller_id; new.sales_count := old.sales_count; new.approved_at := old.approved_at;
  if new.status <> old.status and not (
       (old.status = 'uploading' and new.status = 'pending')
    or (old.status = 'live' and new.status in ('paused','removed'))
    or (old.status = 'paused' and new.status in ('live','removed'))
    or (old.status in ('pending','rejected') and new.status = 'removed')
    or (old.status = 'rejected' and new.status = 'pending')) then
    new.status := old.status;
  end if;
  if (new.shots is distinct from old.shots or new.storage_path is distinct from old.storage_path) and old.status not in ('uploading') then
    new.status := 'pending'; new.approved_at := null;
  end if;
  return new;
end $$;
drop trigger if exists market_guard on public.market_listings;
create trigger market_guard before insert or update on public.market_listings for each row execute function public.market_guard();

create table if not exists public.market_purchases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  price_cents int not null, fee_cents int not null, seller_cents int not null,
  stripe_payment_intent text unique,
  wallet_entry_id bigint,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
alter table public.market_purchases enable row level security;
drop policy if exists market_purchase_read on public.market_purchases;
create policy market_purchase_read on public.market_purchases for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- Wallet entries learn a new kind.
alter table public.wallet_entries drop constraint if exists wallet_entries_kind_check;
alter table public.wallet_entries add constraint wallet_entries_kind_check check (kind = any (array['admin_credit','admin_debit','prize','clip_earning','download_earning','withdrawal','refund','adjustment','market_sale']));

-- Idempotent: the webhook can fire twice, a buyer can't pay twice for the same clip.
create or replace function public.record_market_sale(p_listing uuid, p_buyer uuid, p_payment_intent text) returns public.market_purchases
language plpgsql security definer set search_path = public as $$
declare l public.market_listings; row public.market_purchases; fee int; eid bigint;
begin
  select * into row from public.market_purchases where stripe_payment_intent = p_payment_intent or (listing_id = p_listing and buyer_id = p_buyer) limit 1;
  if row.id is not null then return row; end if;
  select * into l from public.market_listings where id = p_listing;
  if l.id is null then raise exception 'no such listing'; end if;
  fee := public.market_fee(l.price_cents);
  insert into public.market_purchases (listing_id, buyer_id, seller_id, price_cents, fee_cents, seller_cents, stripe_payment_intent)
  values (l.id, p_buyer, l.seller_id, l.price_cents, fee, l.price_cents - fee, p_payment_intent) returning * into row;
  if row.seller_cents > 0 and l.seller_id <> p_buyer then
    insert into public.wallet_entries (player_id, amount_cents, kind, note, ref)
    values (l.seller_id, row.seller_cents, 'market_sale', 'Clip Market: ' || l.title, row.id::text) returning id into eid;
    update public.market_purchases set wallet_entry_id = eid where id = row.id;
  end if;
  update public.market_listings set sales_count = sales_count + 1 where id = l.id;
  insert into public.money_events (kind, player_id, clip_id, amount_cents, note) values ('market_sale', p_buyer, null, l.price_cents, 'Clip Market: ' || l.title);
  return row;
end $$;
revoke execute on function public.record_market_sale(uuid, uuid, text) from public, anon, authenticated;

-- Ask the seller: one thread per buyer per listing.
create table if not exists public.market_threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_at timestamptz not null default now(),
  buyer_seen_at timestamptz not null default now(),
  seller_seen_at timestamptz not null default 'epoch',
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
alter table public.market_threads enable row level security;
drop policy if exists market_thread_read on public.market_threads;
create policy market_thread_read on public.market_threads for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
drop policy if exists market_thread_insert on public.market_threads;
create policy market_thread_insert on public.market_threads for insert with check (buyer_id = auth.uid());
drop policy if exists market_thread_seen on public.market_threads;
create policy market_thread_seen on public.market_threads for update using (buyer_id = auth.uid() or seller_id = auth.uid()) with check (buyer_id = auth.uid() or seller_id = auth.uid());
create or replace function public.market_thread_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select seller_id into new.seller_id from public.market_listings where id = new.listing_id and status = 'live';
    if new.seller_id is null then raise exception 'listing not available'; end if;
    if new.seller_id = new.buyer_id then raise exception 'that is your own clip'; end if;
  else
    new.listing_id := old.listing_id; new.buyer_id := old.buyer_id; new.seller_id := old.seller_id; new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists market_thread_guard on public.market_threads;
create trigger market_thread_guard before insert or update on public.market_threads for each row execute function public.market_thread_guard();

create table if not exists public.market_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.market_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists market_messages_thread on public.market_messages (thread_id, id);
alter table public.market_messages enable row level security;
drop policy if exists market_msg_read on public.market_messages;
create policy market_msg_read on public.market_messages for select using (exists (select 1 from public.market_threads t where t.id = thread_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid() or public.is_admin())));
drop policy if exists market_msg_insert on public.market_messages;
create policy market_msg_insert on public.market_messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.market_threads t where t.id = thread_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())));
create or replace function public.market_msg_touch() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.market_threads set last_at = new.created_at,
    buyer_seen_at = case when buyer_id = new.sender_id then new.created_at else buyer_seen_at end,
    seller_seen_at = case when seller_id = new.sender_id then new.created_at else seller_seen_at end
  where id = new.thread_id;
  return new;
end $$;
drop trigger if exists market_msg_touch on public.market_messages;
create trigger market_msg_touch after insert on public.market_messages for each row execute function public.market_msg_touch();

-- Public seller card: gamertag and verification only.
create or replace view public.market_sellers with (security_invoker = false) as
  select p.id, coalesce(p.gamertag, p.display_name, 'Player') as name, p.gamertag_verified as verified, p.avatar_path,
         (select count(*) from public.market_purchases m where m.seller_id = p.id) as sales
  from public.profiles p where exists (select 1 from public.market_listings l where l.seller_id = p.id and l.status in ('live','paused'));
grant select on public.market_sellers to anon, authenticated;

-- Storage: the video is private (owner and admins only; buyers get a signed link from the server).
-- Screenshots are public: they're the shop window.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('market-files', 'market-files', false, 5368709120, array['video/mp4','video/quicktime','video/webm','video/x-matroska'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types, public = false;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('market-shots', 'market-shots', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types, public = true;

drop policy if exists market_files_put on storage.objects;
create policy market_files_put on storage.objects for insert to authenticated with check (bucket_id = 'market-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists market_files_get on storage.objects;
create policy market_files_get on storage.objects for select to authenticated using (bucket_id = 'market-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists market_files_del on storage.objects;
create policy market_files_del on storage.objects for delete to authenticated using (bucket_id = 'market-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists market_shots_put on storage.objects;
create policy market_shots_put on storage.objects for insert to authenticated with check (bucket_id = 'market-shots' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists market_shots_upd on storage.objects;
create policy market_shots_upd on storage.objects for update to authenticated using (bucket_id = 'market-shots' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists market_shots_del on storage.objects;
create policy market_shots_del on storage.objects for delete to authenticated using (bucket_id = 'market-shots' and (storage.foldername(name))[1] = auth.uid()::text);
