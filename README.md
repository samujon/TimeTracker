## Minimal Self‑Hosted Time Tracker

This is a minimalist, dark‑mode time tracking app built with **Next.js App Router**, **Tailwind CSS**, and **Supabase**.  
It is designed to be self‑hosted and to use **your own** Supabase project for storage.

---

## 1. Prerequisites

- Node.js and npm installed.
- A Supabase account and project.

---

## 2. Install dependencies

From the project root (`TimeTracker`):

```bash
npm install
```

---

## 3. Configure environment variables

In the project root (`TimeTracker`):

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set the two required keys:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public (anon) API key for that project.

> **Note:** These values must match the Supabase project where you will create the database tables in the next step.

---

## 4. Supabase setup

1. Open the **Supabase Dashboard** and select your project.
2. Go to **Settings → API** and copy:
   - the **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - the **anon public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Go to the **SQL Editor**.
4. Open the local file `supabase/schema.sql` from this repo and copy its contents.
5. Paste the SQL into a new SQL query in Supabase and **run** it.

This will:

- Create the `projects` and `time_entries` tables.
- Enable Row Level Security (RLS).
- Add policies allowing the `anon` role to read and write (intended for a single‑user/self‑hosted setup).

If you want to confirm the tables exist, you can run:

```sql
select * from public.time_entries limit 1;
```

---

## 5. Run the app

From the project root (`TimeTracker`):

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

- If the Supabase environment variables are **missing or invalid**, you will see a **Setup** screen with a step‑by‑step guide.
- Once the keys and schema are correctly configured, you will see the **Time Tracker** UI.

---

## 6. How to use the Time Tracker

- **Start a session**
  - Optionally enter a description of what you’re working on.
  - Click **Start** to begin the timer.
- **Stop a session**
  - Click **Stop** to end the timer.
  - The app will create a row in `time_entries` with:
    - description
    - `started_at` and `ended_at` timestamps
    - `duration_seconds`
- **View recent entries**
  - The “Recent entries” panel shows the last 10 sessions, including:
    - description (or “Untitled session”)
    - local start time
    - formatted duration (HH:MM:SS)

All data is stored in your own Supabase project; no external services are used beyond Supabase itself.

