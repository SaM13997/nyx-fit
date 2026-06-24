# Nyx Fit — PWA & App Store Publish Checklist

Track progress toward installable PWA, Play Store (TWA), and iOS wrapper. Work in **one batch per automation run** using the [Agent batching map](#agent-batching-map).

**Last completed batch:** F (`05e0e1f`) — synced to `cursor/nyx-fit-pwa-checklist-d1b3` (`e1a2339`)

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

- [x] `vite-plugin-pwa` is the only manifest author (no stale `public/manifest.json`) — `3d5506a`
- [x] `manifestFilename` is `manifest.json` (TWA / Bubblewrap compatible) — `3d5506a`
- [x] `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` match brand — `3d5506a`

### 1.2 Icons (192 + 512, any + maskable)

- [x] Icons reference `/favicon/web-app-manifest-192x192.png` and `512x512` — `3d5506a`
- [x] Both `any` and `maskable` purposes declared — `3d5506a`
- [x] Favicon set linked in root head (`favicon.ico`, `favicon.svg`, `favicon-96x96`) — `3d5506a`

### 1.3 Apple touch icon

- [x] `apple-touch-icon` points to `/favicon/apple-touch-icon.png` (180×180) — `3d5506a`

### 1.4 Apple meta tags

- [x] `apple-mobile-web-app-title` = Nyx Fitness — `3d5506a`
- [x] `apple-mobile-web-app-capable` = yes — `3d5506a`
- [x] `apple-mobile-web-app-status-bar-style` = black-translucent — `3d5506a`
- [x] `theme-color` = `#000000` (dark-first) — `3d5506a`

### 1.5 Head manifest link

- [x] Root route links `rel="manifest"` → `/manifest.json` (generated at build) — `3d5506a`

### 1.6 Splash screens _(Batch B)_

- [x] iOS / Android splash assets or meta where applicable — `e467587`

### 1.7 Offline shell _(Batch B)_

- [x] Service worker caches app shell; offline UX acceptable — `e467587`

### 1.8 Install prompt _(Batch B)_

- [x] `InstallPrompt` styled on-brand; dismiss + install flows work — `e467587`

### 1.9 Lighthouse PWA _(Batch B)_

- [x] Lighthouse PWA audit passes on production preview build — `e467587` (score 100)

---

## Phase 2 — Mobile QA _(Batch E)_

- [x] 390×844 viewport: home, workouts, weights, settings — no overflow — `ae92c37`
- [x] Bottom nav safe area; tap targets ≥ 44px — `14941c8`
- [x] Auth: login, session persist, logout — `14941c8` (login redirect + logout flow verified in preview)
- [x] Settings: profile, appearance, rest timer — `14941c8`

---

## Phase 3 — Legal _(Batch C)_

- [x] `/privacy` page with store-ready privacy policy — `81f3a34`
- [x] `/terms` page with terms of service — `81f3a34`
- [x] Links from settings / install flows — `81f3a34`

---

## Phase 4 — Android TWA _(Batch D)_

### 4.1 Digital Asset Links

- [x] `/.well-known/assetlinks.json` matches release signing key — `1099bed`; `scripts/verify-assetlinks.mjs`

### 4.2 Keystore documentation

- [x] Keystore generation + CI secrets documented (no secrets in repo) — `1099bed`; `docs/android-twa-signing.md`

### 4.3 Bubblewrap / TWA manifest

- [x] `builds/twa-manifest.json` aligned with live manifest URL and theme — `1099bed`

### 4.4 CI build APK/AAB

- [x] Workflow builds signed bundle (secrets in CI only) — `1099bed`; `.github/workflows/twa-build.yml`

---

## Phase 5 — iOS wrapper _(Batch F)_

- [x] Capacitor or PWABuilder iOS scaffold decision recorded — `05e0e1f`; `docs/ios-wrapper.md` (Capacitor 7 chosen over PWABuilder)
- [x] Minimal wrapper project with shared manifest / icons — `05e0e1f`; `capacitor.config.ts`, `ios/`, `builds/ios-capacitor.json`, `scripts/sync-ios-assets.mjs`

---

## Phase 6 — Store submission _(human / accounts required — not agent batches)_

- [ ] Google Play Console app created; TWA CI secrets configured (`TWA_KEYSTORE_*`)
- [ ] Play Store listing: screenshots, description, privacy policy URL
- [ ] Apple Developer account; `npx cap sync ios` on macOS; App Store Connect listing
- [ ] Production Convex deploy + `SITE_URL` / OAuth redirect URIs for store builds

---

## Notes

- Do **not** enable Play Billing or web push unless a batch explicitly covers them.
- Convex production deploy, keystore secrets, and store developer accounts are **stop conditions** — report in Slack, do not mark items complete.
- TWA CI requires GitHub secrets: `TWA_KEYSTORE_BASE64`, `TWA_KEYSTORE_PASSWORD`, `TWA_KEY_ALIAS`, `TWA_KEY_PASSWORD` (see `docs/android-twa-signing.md` when added).
- iOS wrapper: see `docs/ios-wrapper.md`; run `npx cap add ios` on macOS, then `npm run ios:assets` and `npx cap sync ios`.
