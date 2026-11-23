-- Live From Leonida — schema v54: Clip Market refunds, admin control, market support topic.

alter table public.market_purchases
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_note text,
  add column if not exists refunded_by uuid references public.profiles(id);

alter table public.wallet_entries drop constraint if exists wallet_entries_kind_check;
alter table public.wallet_entries add constraint wallet_entries_kind_check check (kind = any (array[
  'admin_credit','admin_debit','prize','clip_earning','download_earning','withdrawal','refund','adjustment','market_sale','market_refund']));

-- Staff refund, service role only (the API checks staff and refunds the card in Stripe first). One step: mark the purchase refunded,
-- take the seller's share back from their wallet, and drop the sale from the listing's count.
create or replace function public.refund_market_purchase(p_purchase uuid, p_note text, p_actor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p public.market_purchases; t text;
begin
  select * into p from public.market_purchases where id = p_purchase for update;
  if p.id is null then raise exception 'NOT_FOUND'; end if;
  if p.refunded_at is not null then raise exception 'ALREADY_REFUNDED'; end if;
  select title into t from public.market_listings where id = p.listing_id;
  update public.market_purchases set refunded_at = now(), refund_note = nullif(trim(p_note), ''), refunded_by = p_actor where id = p.id;
  if p.seller_cents > 0 then
    insert into public.wallet_entries (player_id, amount_cents, kind, note, ref, created_by)
    values (p.seller_id, -p.seller_cents, 'market_refund', 'Clip Market refund: ' || coalesce(t, 'clip'), p.id::text, p_actor);
  end if;
  update public.market_listings set sales_count = greatest(0, sales_count - 1) where id = p.listing_id;
end $$;
revoke all on function public.refund_market_purchase(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.refund_market_purchase(uuid, text, uuid) to service_role;
