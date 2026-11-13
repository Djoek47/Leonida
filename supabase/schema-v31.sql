-- v31: creators earn $0.99 per new paid download; $5 minimum cash-out enforced on the server.
-- Existing downloads keep the creator_cents they were stamped with (70) - the cutover only affects new rows.
-- Rollback: update download_prices set creator_cents = 70, platform_cents = 29; and recreate withdraw_for without the BELOW_MINIMUM line.
update public.download_prices set creator_cents = 99, platform_cents = 0 where id = true;
alter table public.download_prices alter column creator_cents set default 99, alter column platform_cents set default 0;

create or replace function public.withdraw_for(p_user uuid, p_cents integer, p_note text)
returns bigint language plpgsql security definer set search_path to 'public' as $function$
declare avail int; eid bigint; m text; h text;
begin
  if p_cents <= 0 then raise exception 'AMOUNT_ZERO'; end if;
  if p_cents < 500 then raise exception 'BELOW_MINIMUM'; end if;
  perform 1 from public.profiles where id = p_user for update;   -- no duplicate requests
  select available_cents into avail from public.wallet_split(p_user);
  if p_cents > coalesce(avail,0) then raise exception 'INSUFFICIENT_FUNDS'; end if;
  select payout_method, payout_handle into m, h from public.profiles where id = p_user;
  if m is null then raise exception 'NO_METHOD'; end if;
  insert into public.wallet_entries (player_id, amount_cents, kind, note, created_by)
  values (p_user, -p_cents, 'withdrawal', p_note, p_user) returning id into eid;
  insert into public.money_events (kind, player_id, amount_cents, note)
  values ('withdrawal_requested', p_user, p_cents, p_note);
  if m <> 'stripe' then
    insert into public.payouts (creator_id, period_start, period_end, amount_cents,
                                download_count, method, handle, status, note)
    values (p_user, current_date, current_date, p_cents, 0, m, h, 'requested', 'wallet cash-out #' || eid::text);
    insert into public.email_outbox (user_id, kind, data, dedupe)
    values (p_user, 'withdrawal_requested',
            jsonb_build_object('amount', p_cents, 'method', m, 'handle', h), 'cashout:' || eid::text)
    on conflict do nothing;
  end if;
  return eid;
end $function$;
