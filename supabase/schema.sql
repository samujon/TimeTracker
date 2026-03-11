-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

-- Time entries table
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.projects enable row level security;
alter table public.time_entries enable row level security;

-- RLS policies: allow the anonymous role to read and write.
-- This is suitable for a single-user/self-hosted deployment.

create policy "Allow anon read/write projects"
  on public.projects
  for all
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

create policy "Allow anon read/write time_entries"
  on public.time_entries
  for all
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

-- ─── Tags ────────────────────────────────────────────────────────────────────
-- See supabase/tags_migration.sql for the CREATE TABLE statements.
-- Run that file once against your Supabase project to add tag support.

-- Global tag registry
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

-- Project ↔ tag  (project inherits these tags — all its entries include them)
create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id     uuid not null references public.tags(id)     on delete cascade,
  primary key (project_id, tag_id)
);

-- Entry ↔ tag  (entry-specific tags, additive on top of project tags)
create table if not exists public.entry_tags (
  entry_id uuid not null references public.time_entries(id) on delete cascade,
  tag_id   uuid not null references public.tags(id)         on delete cascade,
  primary key (entry_id, tag_id)
);

alter table public.tags         enable row level security;
alter table public.project_tags enable row level security;
alter table public.entry_tags   enable row level security;

create policy "Allow anon read/write tags"
  on public.tags for all
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

create policy "Allow anon read/write project_tags"
  on public.project_tags for all
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

create policy "Allow anon read/write entry_tags"
  on public.entry_tags for all
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

