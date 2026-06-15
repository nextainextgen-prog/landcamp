-- 002_rls_fix.sql
--
-- The initial policies in 001_init.sql did not explicitly bind to roles.
-- Some Postgres / Supabase combinations interpret this as "no role applies",
-- which causes anon clients to be rejected even when `with check (true)`.
-- This file re-creates every policy with explicit role bindings.
--
-- Safe to re-run.

-- ─── reviews ──────────────────────────────
drop policy if exists "reviews are publicly readable" on public.reviews;
create policy "reviews are publicly readable"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

-- ─── leads ────────────────────────────────
drop policy if exists "anyone can submit a lead" on public.leads;
create policy "anyone can submit a lead"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- ─── rooms ────────────────────────────────
drop policy if exists "rooms are publicly readable" on public.rooms;
create policy "rooms are publicly readable"
  on public.rooms
  for select
  to anon, authenticated
  using (true);

-- ─── menu_items ───────────────────────────
drop policy if exists "menu items are publicly readable" on public.menu_items;
create policy "menu items are publicly readable"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);

-- Make absolutely sure the anon role has table-level INSERT on leads.
-- (Supabase grants this by default, but doesn't hurt to be explicit.)
grant insert on public.leads to anon, authenticated;
grant select on public.reviews, public.rooms, public.menu_items to anon, authenticated;
