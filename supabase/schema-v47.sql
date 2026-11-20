-- Daily news: an inbox the cron fills from Serper, and the LED ticker's lines.

create table if not exists public.news_inbox (
  id uuid primary key default gen_random_uuid(),
  link text not null unique,
  title text not null,
  source text not null default '',
  snippet text not null default '',
  published text,
  status text not null default 'new' check (status in ('new','used','dismissed')),
  fetched_at timestamptz not null default now()
);
alter table public.news_inbox enable row level security;
drop policy if exists news_admin on public.news_inbox;
create policy news_admin on public.news_inbox for all using (public.is_admin()) with check (public.is_admin());
create index if not exists news_inbox_new on public.news_inbox (status, fetched_at desc);

create table if not exists public.ticker_items (
  id uuid primary key default gen_random_uuid(),
  text text not null check (length(text) between 3 and 140),
  kind text not null default 'manual' check (kind in ('manual','auto')),
  source text not null default '',
  link text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ticker_items enable row level security;
-- The ticker is public: anyone reads live lines; only admins see hidden ones or write.
drop policy if exists ticker_read on public.ticker_items;
create policy ticker_read on public.ticker_items for select using (active or public.is_admin());
drop policy if exists ticker_write on public.ticker_items;
create policy ticker_write on public.ticker_items for all using (public.is_admin()) with check (public.is_admin());
create index if not exists ticker_live on public.ticker_items (active, created_at desc);
