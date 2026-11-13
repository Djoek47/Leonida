-- v35: Daily Drop entries are paid-only (Street and up), enforced on the server.
-- Rollback: drop trigger clip_drop_paid_guard on public.clips; drop function public.check_drop_paid();
create or replace function public.check_drop_paid() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.drop_id is not null and (tg_op = 'INSERT' or new.drop_id is distinct from old.drop_id)
     and not public.is_paying(new.owner_id) and not coalesce(public.is_admin(), false) then
    raise exception 'DROP_PAID_ONLY';
  end if;
  return new;
end $$;
drop trigger if exists clip_drop_paid_guard on public.clips;
create trigger clip_drop_paid_guard before insert or update of drop_id on public.clips for each row execute function public.check_drop_paid();
