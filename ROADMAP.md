# Roadmap

## Short term

- [ ] **Tags/categories** on entries (beyond just project name) for finer reporting
- [x] **Running timer indicator** in the browser tab title (e.g. `⏱ 01:23 – My Task`)
- [x] **Keyboard shortcuts** — start/stop timer, switch tabs
- [x] **Export** — download entries as CSV for the current period
- [ ] **Entry notes** — free-text field on each entry beyond just task name

## Mid term

- [ ] **Goals / targets** — set a weekly hour target per project and show progress
- [ ] **Billable hours flag** — mark entries as billable and filter/sum separately
- [ ] **Richer statistics** — heatmap calendar, project breakdown donut chart, streaks
- [ ] **PWA support** — installable on mobile, offline-capable timer (stores locally, syncs when online)
- [ ] **Date range reports** — custom range picker, not just daily/weekly/monthly
- [ ] **Idle detection** — warn if the timer has been running for an unusually long time

## Long term (fun for learning)

- [ ] **Auth** — Supabase Auth (email/Google) with Row Level Security so each user only sees their own data
- [ ] **Workspaces/teams** — shared projects across team members, visibility controls
- [ ] **Invite flow** — owner invites members to a workspace
- [ ] **Self-hosted installer** — a `docker-compose.yml` bundling the Next.js app + Supabase for one-command VPS deployment
- [ ] **Public hosted version** — deploy to Vercel + Supabase cloud as the zero-setup option alongside the self-hosted path
- [ ] **API / integrations** — REST or webhook endpoints so entries can be posted from CLI tools, browser extensions, or Zapier
