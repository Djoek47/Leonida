-- v41: a retry of an already-accepted submission is recognised as a duplicate, not charged and not refused as over-limit.
create or replace function public.check_weekly_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int; used int;
begin
  if new.submitted_by is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('upload:' || new.submitted_by::text, 0));
  if new.idem_key is not null and exists (select 1 from public.clips where submitted_by = new.submitted_by and idem_key = new.idem_key) then
    raise exception 'DUPLICATE_SUBMISSION';
  end if;
  cap := coalesce(public.tier_allowance(new.submitted_by), 2);
  select count(*) into used from public.upload_slots
   where user_id = new.submitted_by and week_start = public.upload_week_start(now());
  if used >= cap then raise exception 'WEEKLY_LIMIT'; end if;
  return new;
end $$;
