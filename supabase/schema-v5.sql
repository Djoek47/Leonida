-- Live From Leonida — schema v5: unclaimed clips must not break a close-out,
-- and an approved claim has to carry the win with it.
-- Run AFTER schema-v4.sql. Safe to re-run.

-- A clip can sit unclaimed (owner_id null) until someone proves it is theirs.
-- close_contest awarded a badge to that null owner and took the whole
-- close-out down with it, the first time a staff-found clip placed.
create or replace function public.close_contest(p_contest uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.contests; r record; i int := 0; cut int[]; mult int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into k from public.contests where id = p_contest;
  if k.id is null then raise exception 'NO_SUCH_CONTEST'; end if;
  mult := case k.period when 'year' then 20 when 'month' then 4 else 1 end;
  select array[gold_cents * mult, silver_cents * mult, bronze_cents * mult] into cut
    from public.bracket_for(k.payers_at_open);

  for r in select c.id, c.owner_id, count(v.*) as score, c.created_at
             from public.clips c left join public.votes v on v.clip_id = c.id
            where c.contest_id = p_contest and c.status in ('approved','featured')
            group by c.id, c.owner_id, c.created_at
            order by score desc, c.created_at asc limit 3
  loop
    i := i + 1;
    insert into public.winnings (contest_id, clip_id, owner_id, place, amount_cents)
    values (p_contest, r.id, r.owner_id, i, cut[i]) on conflict (contest_id, place) do nothing;
    if r.owner_id is not null then
      insert into public.earned_badges (player_id, badge, clip_id)
      values (r.owner_id, k.period || '_' || (array['gold','silver','bronze'])[i], r.id)
      on conflict do nothing;
    end if;
  end loop;

  update public.contests set status = 'closed' where id = p_contest;
  insert into public.money_events (kind, amount_cents, note) values ('contest_closed', k.pool_cents, k.title);
end $$;

-- Same hole in the Daily Drop: an unclaimed clip can win one.
create or replace function public.pick_drop_winner(p_drop uuid, p_clip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.daily_drops set winner_clip_id = p_clip where id = p_drop;
  update public.clips set trending_until = now() + interval '7 days' where id = p_clip
    returning owner_id into owner;
  if owner is not null then
    insert into public.earned_badges (player_id, badge, clip_id)
    values (owner, 'drop_winner', p_clip) on conflict do nothing;
  end if;
end $$;

-- When a claim is approved the clip changes hands; the prize and the badges
-- follow it, otherwise a claimed win pays nobody.
create or replace function public.approve_claim(p_claim uuid) returns void
language plpgsql security definer set search_path = public as $$
declare cl public.claims; per text;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into cl from public.claims where id = p_claim;
  if cl.id is null then raise exception 'NO_SUCH_CLAIM'; end if;

  update public.claims set status = 'approved' where id = p_claim;
  update public.claims set status = 'rejected' where clip_id = cl.clip_id and id <> p_claim and status = 'open';
  update public.clips    set owner_id = cl.claimant_id where id = cl.clip_id;
  update public.winnings set owner_id = cl.claimant_id where clip_id = cl.clip_id and owner_id is null;

  for per in select distinct c.period from public.winnings w
               join public.contests c on c.id = w.contest_id
              where w.clip_id = cl.clip_id loop
    insert into public.earned_badges (player_id, badge, clip_id)
    select cl.claimant_id, per || '_' || (array['gold','silver','bronze'])[w.place], cl.clip_id
      from public.winnings w where w.clip_id = cl.clip_id
    on conflict do nothing;
  end loop;
end $$;
