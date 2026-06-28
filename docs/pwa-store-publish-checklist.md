# Nyx Fit — PWA & App Store Publish Checklist

Track progress toward installable PWA, Play Store (TWA), and iOS wrapper. Work in **one batch per automation run** using the [Agent batching map](#agent-batching-map).

**Last completed batch:** F — consolidated on branch `dev-pwa` (2026-06-24)

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

- [x] `vite-plugin-pwa` is the only manifest author (no stale `public/manifest.json`) — `7ec0101`
- [x] `manifestFilename` is `manifest.json` (TWA / Bubblewrap compatible)
- [x] `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` match brand

### 1.2 Icons (192 + 512, any + maskable)

- [x] Icons reference `/favicon/web-app-manifest-192x192.png` and `512x512`
- [x] Both `any` and `maskable` purposes declared
- [x] Favicon set linked in root head (`favicon.ico`, `favicon.svg`, `favicon-96x96`)

### 1.3 Apple touch icon

- [x] `apple-touch-icon` points to `/favicon/apple-touch-icon.png` (180×180)

### 1.4 Apple meta tags

- [x] `apple-mobile-web-app-title` = Nyx Fitness
- [x] `apple-mobile-web-app-capable` = yes
- [x] `apple-mobile-web-app-status-bar-style` = black-translucent
- [x] `theme-color` = `#000000` (dark-first)

### 1.5 Head manifest link

- [x] Root route links `rel="manifest"` → `/manifest.json` (generated at build)

### 1.6 Splash screens _(Batch B)_

- [x] iOS / Android splash assets or meta where applicable — `39f1720`

### 1.7 Offline shell _(Batch B)_

- [x] Service worker caches app shell; offline UX acceptable — `d4f0cf7`

### 1.8 Install prompt _(Batch B)_

- [x] `InstallPrompt` styled on-brand; dismiss + install flows work — `39f1720`

### 1.9 Lighthouse PWA _(Batch B)_

- [x] Lighthouse PWA audit passes on production preview build — `760b22d` (Lighthouse v11 PWA score 100; SW registration + navigateFallback)

---

## Phase 2 — Mobile QA _(Batch E)_

- [x] 390×844 viewport: home, workouts, weights, settings — no overflow — `c20b95b`
- [x] Bottom nav safe area; tap targets ≥ 44px — `c20b95b`
- [x] Auth: login, session persist, logout — `c20b95b`
- [x] Settings: profile, appearance, rest timer — `c20b95b`

---

## Phase 3 — Legal _(Batch C)_

- [x] `/privacy` page with store-ready privacy policy — `72e7bf9`
- [x] `/terms` page with terms of service — `72e7bf9`
- [x] Links from settings / install flows — `72e7bf9`

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
- [x] Minimal Capacitor scaffold (`capacitor.config.ts`, `ios/`, shared icons via `npm run ios:sync-assets`) — `73bad7b`

---

## Notes

- Do **not** enable Play Billing or web push unless a batch explicitly covers them.
- Convex production deploy, keystore secrets, and store developer accounts are **stop conditions** — report in Slack, do not mark items complete.
