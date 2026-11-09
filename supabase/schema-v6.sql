-- Live From Leonida — schema v6: take the internal functions off the public API.
-- Run AFTER schema-v5.sql. Safe to re-run.
--
-- Supabase exposes every function in `public` as a REST endpoint. Three of
-- these had no caller check at all, so anyone holding the publishable key
-- could have hit them:
--   record_paid_download -> invent a paid download and credit a creator 70c of our money
--   grant_cycle_credits  -> hand themselves credits, and backdate subscribed_since
--                           to fake the six-star tracker
--   expire_streaks       -> wipe every member's streak
-- They are service-side calls, so they come off the API entirely. The trigger
-- functions were never meant to be callable either.

revoke all on function public.record_paid_download(uuid, uuid, text) from anon, authenticated;
revoke all on function public.grant_cycle_credits(uuid, timestamptz)  from anon, authenticated;
revoke all on function public.expire_streaks()                        from anon, authenticated;

revoke all on function public.handle_new_user()      from anon, authenticated;
revoke all on function public.award_clipper()        from anon, authenticated;
revoke all on function public.touch_streak()         from anon, authenticated;
revoke all on function public.check_daily_cap()      from anon, authenticated;
revoke all on function public.cap_clip_tags()        from anon, authenticated;
revoke all on function public.check_contest_length() from anon, authenticated;

-- Staff actions all check is_admin() inside, but a signed-out visitor has no
-- business reaching them at all.
revoke all on function public.adjust_wallet(uuid, integer, text) from anon;
revoke all on function public.approve_claim(uuid)                from anon;
revoke all on function public.close_contest(uuid)                from anon;
revoke all on function public.open_contest(uuid)                 from anon;
revoke all on function public.pay_winnings_to_wallet(uuid)       from anon;
revoke all on function public.pick_drop_winner(uuid, uuid)       from anon;
revoke all on function public.run_monthly_payouts(date, date)    from anon;
revoke all on function public.set_role(uuid, text)               from anon;

-- Member actions need a session; signed out they only ever raise.
revoke all on function public.cast_vote(uuid)             from anon;
revoke all on function public.clear_vote(uuid)            from anon;
revoke all on function public.download_with_credit(uuid)  from anon;
revoke all on function public.request_withdrawal(integer) from anon;
revoke all on function public.my_balance_cents()          from anon;
revoke all on function public.my_stars()                  from anon;
revoke all on function public.my_rank()                   from anon;
revoke all on function public.my_tier()                   from anon;
revoke all on function public.my_votes_allowed()          from anon;
revoke all on function public.can_submit()                from anon;
revoke all on function public.can_use(text)               from anon;
revoke all on function public.submissions_today(uuid)     from anon;
revoke all on function public.is_paying(uuid)             from anon;

-- Left open on purpose: the prize pool and the voting window are public facts
-- the site shows before you sign in.
--   paying_user_count, weekly_pool_cents, monthly_pool_cents, period_pool_cents,
--   bracket_for, voting_open, can_see_votes, can_use_channel, is_admin
