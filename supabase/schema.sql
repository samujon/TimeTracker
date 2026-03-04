-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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

