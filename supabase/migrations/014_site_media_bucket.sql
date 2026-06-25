-- 014_site_media_bucket.sql
--
-- Public Storage bucket for website images uploaded via the CMS image manager
-- (ROADMAP 3.3). Images are public (shown on the marketing site), uploaded
-- through the service-role admin client, and served by their public URL.
--
-- Safe to re-run.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Public buckets are already readable via their public URL; this policy makes
-- the intent explicit and covers the storage API list/select path too.
drop policy if exists "site-media public read" on storage.objects;
create policy "site-media public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'site-media');
