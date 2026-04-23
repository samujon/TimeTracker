# Roadmap

## Short term

- [x] **Tags/categories** on entries (beyond just project name) for finer reporting — multi-tag, colored; project-level tags inherited by entries; entry-specific tags additive; stats filter by tag (OR)
- [x] **Running timer indicator** in the browser tab title (e.g. `⏱ 01:23 – My Task`)
- [x] **Keyboard shortcuts** — start/stop timer, switch tabs
- [x] **Export** — download entries as CSV for the current period
- [x] **Editor tab** — additional tab to allow manual editing of all existing entries
- [ ] **Entry notes** — free-text field on each entry beyond just task name
- [ ] **Pomodoro mode** — 25/5 timer with auto-break prompts; integrates with the existing timer
- [ ] **Favorites / pinned projects** — quick-start buttons for your top projects
- [ ] **Timer reminders** — notify if you forgot to start/stop (e.g. "You haven't tracked anything since 10:00")

## Mid term

- [ ] **Goals / targets** — set a weekly hour target per project and show progress
- [ ] **Billable hours flag** — mark entries as billable and filter/sum separately
- [x] **Richer statistics** — heatmap calendar, project breakdown donut chart, streaks
- [ ] **PWA support** — installable on mobile, offline-capable timer (stores locally, syncs when online)
- [ ] **Date range reports** — custom range picker, not just daily/weekly/monthly
- [ ] **Idle detection** — warn if the timer has been running for an unusually long time
- [ ] **Recurring entries** — auto-fill daily standups, lunch breaks, etc.
- [ ] **Time rounding** — round to nearest 5/15 min for invoicing
- [ ] **Multi-timer / task switching** — pause one timer and start another; keep a stack
- [ ] **Weekly timesheet view** — grid of projects × days, fill in hours like a classic timesheet
- [ ] **Calendar import** — pull Google Calendar events as draft entries to confirm

## Long term (fun for learning)

- [x] **Auth** — Supabase Auth (email/Google) with Row Level Security so each user only sees their own data
- [ ] **Workspaces/teams** — shared projects across team members, visibility controls
- [ ] **Invite flow** — owner invites members to a workspace
- [ ] **Self-hosted installer** — a `docker-compose.yml` bundling the Next.js app + Supabase for one-command VPS deployment
- [x] **Public hosted version** — deploy to Vercel + Supabase cloud as the zero-setup option alongside the self-hosted path
- [ ] **API / integrations** — REST or webhook endpoints so entries can be posted from CLI tools, browser extensions, or Zapier
- [ ] **Reports with PDF export** — formatted weekly/monthly summaries for clients
- [ ] **Browser extension** — start/stop from any tab, auto-detect project from URL (GitHub, Jira, etc.)
- [ ] **Auto-categorization** — suggest project/tags based on description history

## Compliance guardrails

- Hosted deployment target keeps only Supabase auth cookies by default. Theme and sidebar preferences do not persist across visits.
- Self-hosted deployers need their own cookie/storage assessment if they add analytics, error reporting, embedded media, chat widgets, or other third-party tooling.
- Any future client-side persistence or third-party SDK should trigger a fresh cookie/storage review before release.
