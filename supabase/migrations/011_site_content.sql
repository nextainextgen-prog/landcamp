-- 011_site_content.sql
--
-- CMS content store for the public marketing site (ROADMAP step 3).
--
-- The public site renders from code-level defaults (data/*.ts + inline section
-- text). This table holds OVERRIDES only: a single-row document keyed id=1 with
-- a `draft` (work-in-progress, used for live preview) and a `published` blob
-- (what visitors see). The app deep-merges the published override over the code
-- defaults at read time, so the site never breaks even when this table is empty
-- or missing.
--
-- `site_content_versions` keeps a snapshot of every publish so the owner can
-- roll back to an earlier version.
--
-- All reads/writes go through the service-role admin client; RLS is enabled and
-- left deny-by-default for anon/authenticated (no public policy).
--
-- Safe to re-run.

create table if not exists public.site_content (
  id smallint primary key default 1,
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint site_content_singleton check (id = 1)
);

-- Ensure the singleton row exists.
insert into public.site_content (id) values (1) on conflict (id) do nothing;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_updated_at();

create table if not exists public.site_content_versions (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  label text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists site_content_versions_created_idx
  on public.site_content_versions (created_at desc);

alter table public.site_content enable row level security;
alter table public.site_content_versions enable row level security;
