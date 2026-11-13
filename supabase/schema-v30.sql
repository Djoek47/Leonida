-- v30: no hard duration rejection. Size (600 MB) and the 3-tag limit still apply.
-- Rollback: recreate trigger clip_length_guard from schema-v2.sql and the duration line in schema-v26.sql.
drop trigger if exists clip_length_guard on public.clips;

create or replace function public.enter_clip_in_round(p_clip uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c clips; r uuid;
begin
  select * into c from clips where id = p_clip;
  if c.id is null or c.owner_id is distinct from auth.uid() then raise exception 'NOT_YOURS'; end if;
  if c.status not in ('approved','featured') then raise exception 'NOT_LIVE'; end if;
  if c.for_contest or c.contest_id is not null then raise exception 'ALREADY_ENTERED'; end if;
  perform ensure_weekly_rounds(2);
  select id into r from contests where kind = 'weekly' and timezone is not null
     and submissions_close > now() and status not in ('closed','paid') and coalesce(state,'') not in ('finalized','result_review')
   order by submissions_close asc limit 1;
  if r is null then raise exception 'NO_OPEN_ROUND'; end if;
  perform set_config('app.entering_round', '1', true);
  update clips set for_contest = true, contest_id = r where id = p_clip;
  return r;
end $$;
revoke all on function public.enter_clip_in_round(uuid) from public, anon;
grant execute on function public.enter_clip_in_round(uuid) to authenticated;
