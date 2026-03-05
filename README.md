## Minimal Self‑Hosted Time Tracker

A minimalist, dark‑mode time tracking app built with **Next.js App Router**, **Tailwind CSS v4**, and **Supabase**. Designed to be self‑hosted against your own Supabase project — no third‑party tracking, all data in your own database.

### Features

- **Live timer** — start/stop with a single click; elapsed time displayed in real time
- **Manual entries** — log past sessions by date, start/end time, or duration (e.g. `1:30` or `90m`)
- **Tasks** — create colour‑coded task labels; reuse them across sessions; edit colours at any time
- **Recent entries** — view, edit, copy, and delete your last 10 sessions
- **Statistics** — daily, weekly, and monthly bar charts grouped by period or task; ISO 8601 week numbering (Monday start)

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Charts | Chart.js + react-chartjs-2 |
| Date utilities | date-fns |

---

## 1. Prerequisites

- Node.js ≥ 20 and npm
- A [Supabase](https://supabase.com) account and project

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Both values are found in your Supabase project under **Settings → API**.

---

## 4. Set up the database schema

1. Open the **Supabase Dashboard** → **SQL Editor**.
2. Copy the contents of [`supabase/schema.sql`](supabase/schema.sql) from this repo.
3. Paste into a new query and run it.

This creates the `projects` and `time_entries` tables, enables Row Level Security, and adds `anon`‑role read/write policies suitable for a single‑user setup.

---

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- If the environment variables are missing or invalid you will see a **Setup** screen with instructions.
- Once configured correctly the **Time Tracker** UI loads automatically.

---

## 6. Other scripts

| Script | Purpose |
|---|---|
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm test` | Run unit tests (Jest) |

---

## 7. How to use

### Timer
1. Optionally type a description and select a task.
2. Click **Start** to begin timing.
3. Click **Stop** when done — an entry is saved automatically.

### Manual entry
Fill in the date, start time, and end time (or a duration like `1:30` or `90m`) and click **Save manual entry**.

### Tasks
- Type a new name and click **Add** to create a task; use the colour swatch to choose a colour first.
- Select an existing task from the dropdown to associate it with a session; click its colour swatch to change the colour at any time.
- Switch to the **Delete** tab to remove tasks you no longer need.

### Statistics
Navigate to the **Stats** page to view charts of your tracked time. Use the view toggle (Daily / Weekly / Monthly) and the **Split by period / task** toggle to explore your data.

### Theme switcher
Toggle between dark mode or light mode

---

## 8. Data storage

All data lives in your own Supabase project. No analytics or external services beyond Supabase itself.
