# Nyx Fit — PWA & App Store Publish Checklist

Track progress toward installable PWA, Play Store (TWA), and iOS wrapper. Work in **one batch per automation run** using the [Agent batching map](#agent-batching-map).

**Last completed batch:** F — pending commit (2026-06-24)

---

## Agent batching map

| Batch | Scope | Phases |
|-------|--------|--------|
| **A** | Manifest consolidation, icons, Apple meta | 1.1–1.5 |
| **B** | Splash, offline, InstallPrompt, Lighthouse fixes | 1.6–1.9 |
| **C** | Privacy policy + terms pages and links | 3 |
| **D** | TWA asset links, keystore docs, Bubblewrap CI | 4.1–4.4 |
| **E** | Mobile QA, settings, auth edge cases | 2 |
| **F** | iOS wrapper scaffold | 5 |

---

## Phase 1 — PWA installability

### 1.1 Single manifest source (`vite.config.ts`)

- [x] `vite-plugin-pwa` is the only manifest author (no stale `public/manifest.json`) — `b5e42ed`
- [x] `manifestFilename` is `manifest.json` (TWA / Bubblewrap compatible) — `b5e42ed`
- [x] `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` match brand — `b5e42ed`

### 1.2 Icons (192 + 512, any + maskable)

- [x] Icons reference `/favicon/web-app-manifest-192x192.png` and `512x512` — `b5e42ed`
- [x] Both `any` and `maskable` purposes declared — `b5e42ed`
- [x] Favicon set linked in root head (`favicon.ico`, `favicon.svg`, `favicon-96x96`) — `b5e42ed`

### 1.3 Apple touch icon

- [x] `apple-touch-icon` points to `/favicon/apple-touch-icon.png` (180×180) — `b5e42ed`

### 1.4 Apple meta tags

- [x] `apple-mobile-web-app-title` = Nyx Fitness — `b5e42ed`
- [x] `apple-mobile-web-app-capable` = yes — `b5e42ed`
- [x] `apple-mobile-web-app-status-bar-style` = black-translucent — `b5e42ed`
- [x] `theme-color` = `#000000` (dark-first) — `b5e42ed`

### 1.5 Head manifest link

- [x] Root route links `rel="manifest"` → `/manifest.json` (generated at build) — `b5e42ed`

### 1.6 Splash screens _(Batch B)_

- [x] iOS splash `apple-touch-startup-image` links for 8 device sizes — `cf3b5ba`
- [x] Splash PNG assets under `/favicon/splash/` — `cf3b5ba`

### 1.7 Offline shell _(Batch B)_

- [x] Workbox service worker (`sw.js`) with app-shell precache + navigate fallback — `cf3b5ba`
- [x] `OfflineBanner` shows when offline; cached pages still work — `cf3b5ba`
- [x] `ServiceWorkerRegistration` registers `/sw.js` in preview/production — `cf3b5ba`

### 1.8 Install prompt _(Batch B)_

- [x] `InstallPrompt` orange-accent styling, 44px tap targets, dismiss persistence (7 days) — `cf3b5ba`
- [x] Skips prompt when already standalone or recently dismissed — `cf3b5ba`

### 1.9 Lighthouse PWA _(Batch B)_

- [x] `npm run lighthouse:pwa` script (Lighthouse v11) passes on preview build — `cf3b5ba`

---

## Phase 2 — Mobile QA _(Batch E)_

- [x] 390×844 viewport: home, workouts, weights, settings — no overflow — `f42a330`
- [x] Bottom nav safe area; tap targets ≥ 44px — `f42a330`
- [x] Auth: login, session persist, logout — `f42a330`
- [x] Settings: profile, appearance, rest timer — `f42a330`

---

## Phase 3 — Legal _(Batch C)_

- [x] `/privacy` page with store-ready privacy policy — `87c4e3e`
- [x] `/terms` page with terms of service — `87c4e3e`
- [x] Links from settings / install flows — `87c4e3e`

---

## Phase 4 — Android TWA _(Batch D)_

### 4.1 Digital Asset Links

- [x] `/.well-known/assetlinks.json` matches release signing key — `builds/assetlinks.config.json` + `npm run twa:sync-assetlinks`

### 4.2 Keystore documentation

- [x] Keystore generation + CI secrets documented (no secrets in repo) — `docs/android-twa.md`; keystore removed from git

### 4.3 Bubblewrap / TWA manifest

- [x] `builds/twa-manifest.json` aligned with live manifest URL and theme — standalone, `#000000`, playBilling off

### 4.4 CI build APK/AAB

- [x] Workflow builds signed bundle (secrets in CI only) — `.github/workflows/twa-build.yml` + `scripts/build-twa.sh`

---

## Phase 5 — iOS wrapper _(Batch F)_

- [x] Capacitor chosen over PWABuilder — `docs/ios-capacitor.md`
- [x] Minimal Capacitor scaffold (`capacitor.config.ts`, `ios/`, shared icons via `npm run ios:sync-assets`)

---

## Notes

- Do **not** enable Play Billing or web push unless a batch explicitly covers them.
- Convex production deploy, keystore secrets, and store developer accounts are **stop conditions** — report in Slack, do not mark items complete.
