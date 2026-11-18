-- Yearly prices rounded: Hustler $192 -> $190, Kingpin $432 -> $430.
-- Run together with the deploy that carries the matching change in src/lib/tiers.ts.
-- Checkout charges whatever this table says, so the two must go out at the same moment.
-- No live subscribers existed when this was written; anyone on the old yearly amount
-- would no longer match a tier in billing/sync, so do not run this once members are paying yearly.
update public.tiers set annual_cents = 19000 where id = 'hustler';
update public.tiers set annual_cents = 43000 where id = 'kingpin';
