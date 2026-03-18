-- ============================================================
-- TimeTracker — canonical fresh-install schema
-- ============================================================
-- Run this in the Supabase SQL editor when creating a brand-new
-- Supabase project. It includes per-user authentication via
-- Supabase Auth and Row Level Security.
--
-- For existing deployments that already have data, run
-- supabase/migrate_add_auth.sql instead.
-- ============================================================

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- ─── Projects ────────────────────────────────────────────────
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

-- ─── Time entries ────────────────────────────────────────────
create table if not exists public.time_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete set null,
  description      text,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

-- ─── Tags ────────────────────────────────────────────────────
-- Global tag registry (each tag is owned by one user)
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

-- Project ↔ tag  (project inherits these tags — all its entries include them)
create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id)  on delete cascade,
  tag_id     uuid not null references public.tags(id)      on delete cascade,
  primary key (project_id, tag_id)
);

-- Entry ↔ tag  (entry-specific tags, additive on top of project tags)
create table if not exists public.entry_tags (
  entry_id uuid not null references public.time_entries(id) on delete cascade,
  tag_id   uuid not null references public.tags(id)         on delete cascade,
  primary key (entry_id, tag_id)
);

-- ─── Row Level Security ──────────────────────────────────────
alter table public.projects     enable row level security;
alter table public.time_entries enable row level security;
alter table public.tags         enable row level security;
alter table public.project_tags enable row level security;
alter table public.entry_tags   enable row level security;

-- projects: each user sees/modifies only their own rows
create policy "Users manage own projects"
  on public.projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- time_entries: same pattern
create policy "Users manage own time_entries"
  on public.time_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tags: same pattern
create policy "Users manage own tags"
  on public.tags for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- project_tags: ownership inherited from projects
create policy "Users manage own project_tags"
  on public.project_tags for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
    )
  );

-- entry_tags: ownership inherited from time_entries
create policy "Users manage own entry_tags"
  on public.entry_tags for all
  using (
    exists (
      select 1 from public.time_entries e
      where e.id = entry_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.time_entries e
      where e.id = entry_id
        and e.user_id = auth.uid()
    )
  );

