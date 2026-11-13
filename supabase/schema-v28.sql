-- v28: weekly round presets, $50 monthly prize, 60/25/15 split on new rounds.

-- Clip of the Month is one total prize for now.
alter table public.site_settings add column if not exists monthly_prize_cents integer not null default 5000;
create or replace function public.monthly_pool_cents() returns integer
language sql stable security definer set search_path = public as
$$ select monthly_prize_cents from public.site_settings where id $$;

-- Presets: every upcoming Thursday-noon round, named in advance, editable in the console.
create table if not exists public.round_presets (
  week_start date primary key,                 -- the Thursday the round opens (platform time)
  title text not null,
  theme text,
  edited boolean not null default false,       -- true once an admin changed it; never overwritten
  created_at timestamptz not null default now()
);
alter table public.round_presets enable row level security;
drop policy if exists "presets admin" on public.round_presets;
create policy "presets admin" on public.round_presets for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.ensure_round_presets(p_weeks integer default 52) returns integer
language plpgsql security definer set search_path = public as $$
declare tz text; themes text[]; d date; last date; n int := 0; k int := 0; t text;
begin
  select platform_timezone, next_theme_options into tz, themes from site_settings limit 1;
  if tz is null then return 0; end if;
  if themes is null or array_length(themes, 1) is null then themes := array['Getaways','Stunts','Heists','Funniest fail']; end if;
  -- start the Thursday after the last round or preset we already hold
  select greatest(
           coalesce((select max((voting_opens at time zone tz)::date) from contests where kind = 'weekly' and timezone is not null), current_date - 7),
           coalesce((select max(week_start) from round_presets), current_date - 7)) into last;
  d := last + 7;
  while extract(isodow from d) <> 4 loop d := d + 1; end loop;
  -- how far through the theme rotation we are, so names keep cycling
  select count(*) into k from round_presets;
  while d <= (now() at time zone tz)::date + 7 * p_weeks loop
    t := themes[1 + (k % array_length(themes, 1))];
    insert into round_presets (week_start, title, theme) values (d, 'Week of ' || to_char(d, 'Mon FMDD') || ': ' || t, t)
      on conflict (week_start) do nothing;
    d := d + 7; k := k + 1; n := n + 1;
  end loop;
  delete from round_presets where week_start < (now() at time zone tz)::date - 21;
  return n;
end $$;

-- Rounds take their name from the preset; new rounds pay 60/25/15.
create or replace function public.ensure_weekly_rounds(p_ahead integer DEFAULT 2) returns integer
language plpgsql security definer set search_path = public as $$
declare tz text; first_thu date; d date; made int := 0; s timestamptz; nm text;
begin
  select platform_timezone into tz from site_settings limit 1;
  if tz is null then return 0; end if;
  perform ensure_round_presets(52);
  select coalesce(max(voting_closes), now()) into s from contests where kind='weekly' and timezone is null;
  first_thu := (s at time zone tz)::date;
  while extract(isodow from first_thu) <> 4 or local_noon(first_thu, tz) < s loop first_thu := first_thu + 1; end loop;
  d := first_thu;
  while local_noon(d, tz) <= now() + make_interval(days => 7 * p_ahead) loop
    if not exists (select 1 from contests where kind='weekly' and voting_opens = local_noon(d, tz)) then
      select title into nm from round_presets where week_start = d;
      insert into contests (title, kind, period, status, state, timezone, pool_cents, split,
                            voting_opens, submissions_close, voting_closes)
      values (coalesce(nm, 'Week of ' || to_char(d, 'Mon FMDD')), 'weekly', 'week', 'voting', 'scheduled', tz, 0, array[0.6,0.25,0.15],
              local_noon(d, tz), local_noon(d + 6, tz), local_noon(d + 7, tz));
      made := made + 1;
    end if;
    d := d + 7;
  end loop;
  return made;
end $$;

-- Admin: open a preset's round now (instead of waiting for the schedule to reach it).
create or replace function public.create_round_from_preset(p_week date) returns uuid
language plpgsql security definer set search_path = public as $$
declare tz text; pr round_presets; cid uuid;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select platform_timezone into tz from site_settings limit 1;
  select * into pr from round_presets where week_start = p_week;
  if pr.week_start is null then raise exception 'No preset for that week'; end if;
  select id into cid from contests where kind='weekly' and voting_opens = local_noon(p_week, tz);
  if cid is not null then return cid; end if;
  insert into contests (title, kind, period, status, state, timezone, pool_cents, split, voting_opens, submissions_close, voting_closes)
  values (pr.title, 'weekly', 'week', 'voting', 'scheduled', tz, 0, array[0.6,0.25,0.15],
          local_noon(p_week, tz), local_noon(p_week + 6, tz), local_noon(p_week + 7, tz))
  returning id into cid;
  return cid;
end $$;
revoke all on function public.create_round_from_preset(date) from anon;
revoke all on function public.ensure_round_presets(integer) from anon, authenticated;

select public.ensure_round_presets(52);
