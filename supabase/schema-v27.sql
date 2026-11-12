-- Kingpin moves from $25 to $45 a month; yearly stays 20% off ($432).
update public.tiers set monthly_cents = 4500, annual_cents = 43200 where id = 'kingpin';
