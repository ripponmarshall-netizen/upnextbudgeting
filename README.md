# UpNextBudgeting

UpNextBudgeting is a mobile-first PWA for bill planning, due-date visibility, light budgeting, and Jamaica-first recurring expense reminders.

## Run Locally

This is a static app. Serve the project root with any local static server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## GitHub Pages

After pushing to GitHub, enable Pages:

1. Open repo Settings.
2. Go to Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.

The app should become available at:

```text
https://YOUR_USERNAME.github.io/UpNextBudgeting/
```

## Supabase Notifications

The app includes optional iPhone Home Screen Web Push support using Supabase Edge Functions.

Frontend public config lives in `app.js`:

```js
const SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  vapidPublicKey: "YOUR_VAPID_PUBLIC_KEY"
};
```

Set these in Supabase secrets:

```text
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
UPNEXT_NOTIFICATION_TOKEN=your_private_setup_code
```

Never commit the VAPID private key or Supabase service role key.

## Notes

- Local app data is stored in `localStorage`.
- Monthly CSV/PDF export and JSON backup/restore are built in.
- Real iPhone push notifications require HTTPS and installing the app to the iPhone Home Screen.
