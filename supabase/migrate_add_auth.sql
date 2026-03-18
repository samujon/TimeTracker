-- ============================================================
-- MIGRATION: Add per-user authentication to existing deployment
-- ============================================================
-- Run this ONCE in the Supabase SQL editor against your
-- existing database. Do NOT run this on a fresh install —
-- use supabase/schema.sql instead.
--
-- After running this script:
--   1. Deploy the updated app to Vercel.
--   2. Sign up / sign in with your account.
--   3. Copy your UUID from Supabase dashboard → Authentication → Users.
--   4. Uncomment and run the UPDATE block at the bottom of this file
--      (Step A) to assign existing rows to your account.
--   5. Uncomment and run the SET NOT NULL block (Step B) to lock
--      the column down.
-- ============================================================


-- ── Step 1: Add nullable user_id columns ────────────────────
-- Nullable so existing rows are preserved without errors.

alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.time_entries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.tags
  add column if not exists user_id uuid references auth.users(id) on delete cascade;


-- ── Step 2: Drop the old anon-only RLS policies ───────────────

drop policy if exists "Allow anon read/write projects"    on public.projects;
drop policy if exists "Allow anon read/write time_entries" on public.time_entries;
drop policy if exists "Allow anon read/write tags"        on public.tags;
drop policy if exists "Allow anon read/write project_tags" on public.project_tags;
drop policy if exists "Allow anon read/write entry_tags"  on public.entry_tags;


-- ── Step 3: Create per-user RLS policies ─────────────────────

-- projects
create policy "Users manage own projects"
  on public.projects for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- time_entries
create policy "Users manage own time_entries"
  on public.time_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- tags
create policy "Users manage own tags"
  on public.tags for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- project_tags: ownership is inherited from projects
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

-- entry_tags: ownership is inherited from time_entries
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


-- ════════════════════════════════════════════════════════════
-- Step A — Assign existing rows to your account
-- ════════════════════════════════════════════════════════════
-- After signing in for the first time, copy your UUID from
-- Supabase dashboard → Authentication → Users, then uncomment
-- and run the three UPDATE statements below.
--
-- replace <YOUR_USER_UUID> with your actual UUID, e.g.:
--   'a1b2c3d4-0000-0000-0000-000000000000'
-- ════════════════════════════════════════════════════════════

-- update public.projects     set user_id = '<YOUR_USER_UUID>' where user_id is null;
-- update public.time_entries set user_id = '<YOUR_USER_UUID>' where user_id is null;
-- update public.tags         set user_id = '<YOUR_USER_UUID>' where user_id is null;


-- ════════════════════════════════════════════════════════════
-- Step B — Lock down user_id (run AFTER Step A)
-- ════════════════════════════════════════════════════════════
-- Once all rows have a user_id, enforce NOT NULL so no row
-- can ever be inserted without an owner.
-- ════════════════════════════════════════════════════════════

-- alter table public.projects     alter column user_id set not null;
-- alter table public.time_entries alter column user_id set not null;
-- alter table public.tags         alter column user_id set not null;
