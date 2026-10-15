# UpNextBudgeting

A minimal, mobile-first PWA that budgets from payday to payday. It answers one question first — **how much is safe to spend before payday?** — and keeps bills, category plans, and spending in one consistent period.

## How it works

- **Budget period** runs from your payday to the day before the next one (set in Settings).
- **Safe to spend** = take-home pay − spent this period − unpaid bills still due (including overdue ones).
- **Budget** gives each category a plan per period. Expenses and paid bills count as *spent*; unpaid bills count as *due*.
- **Recurring bills** schedule their next occurrence automatically when you mark them paid (with undo).

- **Paid bills** count on their due date when paid early or on time, and on the day they were paid when paid late, so paying an overdue bill never raises safe to spend.

Tabs: **Home** (safe to spend, upcoming bills, budget watchlist, recent) · **Budget** (plan vs. actual) · **+** (add expense or bill) · **Bills** (overdue / before payday / later, paid) · **Activity** (search, filter, edit transactions). Settings live behind the gear icon; **About & help** (the ? icon) explains every screen and the math in the app itself.

## Bank alerts

UpNext can turn bank alert texts and emails (NCB, Scotiabank, First Global, JN, CIBC Caribbean, JMMB, VM) into expenses. Nothing is added on its own: each alert waits on Home until you confirm the amount and category, or tap × to ignore it. Deposits are skipped, and US$ charges ask you for the JMD amount.

- **Paste:** + → *Paste a bank alert instead*, paste the SMS or email text, check, add.
- **Gmail:** Settings → *Bank alerts from Gmail* → *Copy setup script*, then follow the steps at the top of [`integrations/gmail-bridge.gs`](integrations/gmail-bridge.gs). In short: a Gmail filter labels your alerts `upnext-alerts`, a Google Apps Script in your own account serves them, and you paste its Web app URL and key into Settings. UpNext checks on open (at most every 30 minutes) and when you tap *Check Gmail*.

The URL and key are stored on this device only, apart from the budget, so backups never contain them. Anyone holding both can read the labelled alerts; run `setup` again to issue a new key.

Parsing is pattern-based (`alerts.js`) and was written without real alert samples, so expect misses. Add redacted real alerts to `tests/alerts.test.mjs` as they turn up.

## Ask Claude

At the bottom of Home (also Settings → Data). It builds a prompt from this period's pay, category plans, last period's spending, unpaid bills and transactions, with a focus of *Review*, *Cut back* or *Next period*. You can edit it, then *Copy prompt* and *Open Claude* to paste it. Merchant names are included; nothing leaves the phone until you paste.

## Getting started

1. Enter your monthly take-home pay and payday.
2. Add your bills once (+ → Bill). Monthly bills roll forward each time you tick them paid.
3. On Budget, give each category a plan until it reads "Every dollar has a job".
4. Log spending with + as it happens.
5. Check Home before you spend.

## Design

Shares the Night Shift Calculator's design language: warm neutral surfaces with one warm accent (light and dark), Geist and Geist Mono (self-hosted in `assets/fonts`, SIL OFL), a floating dock with a gliding highlight, spring sheets and toasts, cards and rows that rise in when a screen opens, numbers that count to their value with a light sweep on the hero card, sliding segmented controls, a tick box that pops and draws its tick before the row folds away, and a splash where the logo draws itself and flies into the header. Everything respects the OS "reduce motion" setting.

`boot.js` runs before first paint (theme + splash); the CSP blocks inline scripts, so it is a file.

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
