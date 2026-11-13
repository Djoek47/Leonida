-- v36: reverts the v31 creator credit change. Creators earn "up to $0.99": the sale price minus payment fees, usually about $0.70.
-- The $5 cash-out minimum from v31 stays. No download was recorded at 99 cents in between.
update public.download_prices set creator_cents = 70, platform_cents = 29 where id = true;
alter table public.download_prices alter column creator_cents set default 70, alter column platform_cents set default 29;
