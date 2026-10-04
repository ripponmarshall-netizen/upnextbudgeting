# UpNextBudgeting

A minimal, mobile-first PWA that budgets from payday to payday. It answers one question first — **how much is safe to spend before payday?** — and keeps bills, category plans, and spending in one consistent period.

## How it works

- **Budget period** runs from your payday to the day before the next one (set in Settings).
- **Safe to spend** = take-home pay − spent this period − unpaid bills still due (including overdue ones).
- **Budget** gives each category a plan per period. Expenses and paid bills count as *spent*; unpaid bills count as *due*.
- **Recurring bills** schedule their next occurrence automatically when you mark them paid (with undo).

Tabs: **Home** (safe to spend, upcoming bills, budget watchlist, recent) · **Budget** (plan vs. actual) · **+** (add expense or bill) · **Bills** (overdue / before payday / later, paid) · **Activity** (search, filter, edit transactions). Settings live behind the gear icon.

## Run locally

Static app — serve the project root:

```bash
python3 -m http.server 4173
```

Then open http://127.0.0.1:4173/. Add `?reset=1` to wipe local data, caches, and the service worker.

## Tests

Budget math lives in `core.js` as pure functions:

```bash
node --test tests/*.test.mjs
```

## Deploy (GitHub Pages)

Settings → Pages → Deploy from a branch → `main` / root.

## Notes

- All data stays in this browser's `localStorage` — nothing is sent to a server. Install the app to your Home Screen so the browser treats storage as persistent (Safari can clear data for sites that aren't installed and go unused for a while).
- Back up from Settings → Download backup; restore the JSON on any device.
- CSV export (per period) is in Settings.
