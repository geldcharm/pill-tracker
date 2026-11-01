# Pill Tracker

A one-tap weekly pill tracker you can install on your phone.

- Tap the day you took your pill. Only one day stays marked at a time.
- Tap the marked day again to clear it.
- The status card says "Taken today" or "Not taken yet today", with the last day it was taken.
- Works offline once installed. Everything is saved on the phone itself.

## Run it locally

```bash
node serve.js
```

Then open http://localhost:8080.

## Live app

https://geldcharm.github.io/pill-tracker/ (GitHub Pages, deployed from the `main` branch).

## Put it on a phone

The app has to be reachable from the phone over HTTPS. Easiest free option: GitHub Pages.

1. Push this folder to a GitHub repository.
2. Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Open the Pages URL on the phone.
4. iPhone: Safari → Share → Add to Home Screen. Android: Chrome shows an "Install app" button.

## Files

- `index.html` – the whole app (layout, styles, logic)
- `manifest.webmanifest` – lets phones install it as an app
- `sw.js` – caches the app so it opens offline
- `icons/` – app icons (regenerate with `node tools/make-icons.js`)
- `serve.js` – tiny local server for testing
