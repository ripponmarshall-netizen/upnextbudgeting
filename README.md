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



## Notes

- Local app data is stored in `localStorage`.
- Monthly CSV/PDF export and JSON backup/restore are built in.
- Real iPhone push notifications require HTTPS and installing the app to the iPhone Home Screen.
