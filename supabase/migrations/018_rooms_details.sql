-- 018_rooms_details.sql
--
-- Make the public website room showcase fully editable from /admin/rooms.
-- The rooms table already has `images` + `amenities` (jsonb) columns; this adds
-- a single `details` jsonb for the remaining website fields so admins can edit
-- everything in one place:
--   { startingPrice, bedSize{th,en}, roomSize{th,en}, layout{th,en},
--     breakfast{th,en}, extraBed{th,en}, services:[{th,en}],
--     checkIn, checkOut, badge{th,en} }   (badge = optional promo text)
--
-- Safe to re-run.

alter table public.rooms
  add column if not exists details jsonb not null default '{}'::jsonb;
