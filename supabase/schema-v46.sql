-- Research tools: guide entries written from the console, and source links on briefings.

alter table public.mission_briefings add column if not exists sources text[] not null default '{}';

create table if not exists public.guide_entries (
  id uuid primary key default gen_random_uuid(),
  topic text not null check (length(topic) between 2 and 60),
  title text not null check (length(title) between 3 and 140),
  body text not null,
  sources text[] not null default '{}',
  published boolean not null default false,
  author_id uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
alter table public.guide_entries enable row level security;

-- The guide is free to read: anyone sees published entries; only admins see drafts or write.
drop policy if exists guide_read on public.guide_entries;
create policy guide_read on public.guide_entries for select using (published or public.is_admin());
drop policy if exists guide_write on public.guide_entries;
create policy guide_write on public.guide_entries for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists guide_touch on public.guide_entries;
create trigger guide_touch before insert or update on public.guide_entries for each row execute function public.touch_briefing();
create index if not exists guide_entries_pub on public.guide_entries (published, topic, published_at desc);
