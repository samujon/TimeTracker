## Minimal Self‑Hosted Time Tracker

A minimalist time tracking app built with **Next.js App Router**, **Tailwind CSS v4**, and **Supabase**. Self‑hosted against your own Supabase project — no third‑party tracking, all data in your own database.

### Features

- **Live timer** — start/stop with a single click; elapsed time shown in real time and in the browser tab title
- **Manual entries** — log past sessions by date, start/end time, or duration (`1:30` or `90m`)
- **Projects** — create colour‑coded projects; reuse them across sessions; edit colours at any time
- **Tags** — multi‑tag system with colour‑coded labels; assign tags globally per project (inherited by all its entries) or add extra tags to individual entries; stats can filter by tag
- **Recent entries** — view, edit, copy, and delete your last 10 sessions
- **Statistics** — daily, weekly, and monthly bar charts grouped by period or project; ISO 8601 week numbering (Monday start)
- **Export** — download entries as CSV for the currently viewed period
- **Keyboard shortcuts** — `Space` to start/stop the timer, `1` / `2` to switch between Tracker and Stats tabs
- **Dark / light mode** — toggle in the UI; respects system preference by default

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
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
2. Copy the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Paste into a new query and run it.

This creates the `projects`, `tags`, `time_entries`, `project_tags`, and `entry_tags` tables, enables Row Level Security, and adds `anon`‑role read/write policies suitable for a single‑user setup.

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
1. Optionally type a description and select a project.
2. Click **Start** to begin timing. The elapsed time appears in the browser tab.
3. Click **Stop** when done — an entry is saved automatically.

### Manual entry
Fill in the date, start time, and end time (or a duration like `1:30` or `90m`) and click **Save manual entry**.

### Projects
- Type a new name and click **Add** to create a project; use the colour swatch to pick a colour first.
- Select an existing project from the dropdown; click its colour swatch to change the colour.
- Switch to the **Delete** tab to remove projects you no longer need.

### Tags
- Open the **Tags** tab in the Projects panel to manage the global tag list.
- Assign tags to a project — all entries logged against that project inherit those tags automatically.
- Tag individual entries in the **Edit entry** modal to add extra context beyond the project tags.
- Filter the Stats view by one or more tags to see time for a specific area of work.

### Statistics
Navigate to the **Stats** page. Use the **Daily / Weekly / Monthly** toggle to change the period and **Split by period / project** to switch the chart grouping.

### Export
Click **Export CSV** on the Stats page to download all visible entries for the current period.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Start / stop the timer |
| `1` | Switch to Tracker tab |
| `2` | Switch to Stats tab |

---

## 8. Data storage

All data lives in your own Supabase project. No analytics or external services are used beyond Supabase itself.
