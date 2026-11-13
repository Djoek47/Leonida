-- Creator payout per download: one global number, 70c minimum, 99c maximum.
-- Only new downloads use it; every download already recorded keeps its own amount.
create or replace function public.set_creator_payout(p_cents int)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_ONLY'; end if;
  if p_cents < 70 or p_cents > 99 then raise exception 'OUT_OF_RANGE'; end if;
  update download_prices set creator_cents = p_cents, platform_cents = price_cents - p_cents where id = true;
  return json_build_object('creator_cents', p_cents, 'platform_cents', 99 - p_cents);
end $$;
revoke all on function public.set_creator_payout(int) from public, anon;
grant execute on function public.set_creator_payout(int) to authenticated;
