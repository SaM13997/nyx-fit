# Nyx Fit — PWA & App Store Publish Checklist

Track progress toward installable PWA, Play Store (TWA), and iOS wrapper. Work in **one batch per automation run** using the [Agent batching map](#agent-batching-map).

**Last completed batch:** F  
**Branch sync:** `cursor/nyx-fit-pwa-checklist-d184` @ `f52492e` (2026-06-24) — verified build pass; no agent batches remaining

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

- [x] `vite-plugin-pwa` is the only manifest author (no stale `public/manifest.json`) — `1734356`
- [x] `manifestFilename` is `manifest.json` (TWA / Bubblewrap compatible) — `1734356`
- [x] `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` match brand — `1734356`

### 1.2 Icons (192 + 512, any + maskable)

- [x] Icons reference `/favicon/web-app-manifest-192x192.png` and `512x512` — `1734356`
- [x] Both `any` and `maskable` purposes declared — `1734356`
- [x] Favicon set linked in root head (`favicon.ico`, `favicon.svg`, `favicon-96x96`) — `1734356`

### 1.3 Apple touch icon

- [x] `apple-touch-icon` points to `/favicon/apple-touch-icon.png` (180×180) — `1734356`

### 1.4 Apple meta tags

- [x] `apple-mobile-web-app-title` = Nyx Fitness — `1734356`
- [x] `apple-mobile-web-app-capable` = yes — `1734356`
- [x] `apple-mobile-web-app-status-bar-style` = black-translucent — `1734356`
- [x] `theme-color` = `#000000` (dark-first) — `1734356`

### 1.5 Head manifest link

- [x] Root route links `rel="manifest"` → `/manifest.json` (generated at build) — `1734356`

### 1.6 Splash screens _(Batch B)_

- [x] iOS / Android splash assets or meta where applicable — `7157662`

### 1.7 Offline shell _(Batch B)_

- [x] Service worker caches app shell; offline UX acceptable — `7157662`

### 1.8 Install prompt _(Batch B)_

- [x] `InstallPrompt` styled on-brand; dismiss + install flows work — `7157662`

### 1.9 Lighthouse PWA _(Batch B)_

- [x] Lighthouse PWA audit passes on production preview build — `7157662` (score 100, lighthouse@11.7.1)

---

## Phase 2 — Mobile QA _(Batch E)_

- [x] 390×844 viewport: home, workouts, weights, settings — no overflow — `b1b9465`
- [x] Bottom nav safe area; tap targets ≥ 44px — `b1b9465`
- [x] Auth: login, session persist, logout — `b1b9465`
- [x] Settings: profile, appearance, rest timer — `b1b9465`

---

## Phase 3 — Legal _(Batch C)_

- [x] `/privacy` page with store-ready privacy policy — `1caba67`
- [x] `/terms` page with terms of service — `1caba67`
- [x] Links from settings / install flows — `1caba67`

---

## Phase 4 — Android TWA _(Batch D)_

See [android-twa-signing.md](./android-twa-signing.md) for keystore, asset links, and CI details.

### 4.1 Digital Asset Links

- [x] `/.well-known/assetlinks.json` matches release signing key — `6d9388a` (verify via `npm run twa:verify-assetlinks`)

### 4.2 Keystore documentation

- [x] Keystore generation + CI secrets documented (no secrets in repo) — `6d9388a` (`docs/android-twa-signing.md`, keystore gitignored)

### 4.3 Bubblewrap / TWA manifest

- [x] `builds/twa-manifest.json` aligned with live manifest URL and theme — `6d9388a`

### 4.4 CI build APK/AAB

- [x] Workflow builds signed bundle (secrets in CI only) — `6d9388a` (`.github/workflows/twa-build.yml`)

---

## Phase 5 — iOS wrapper _(Batch F)_

- [x] Capacitor chosen over PWABuilder — `docs/ios-capacitor.md`
- [x] Minimal Capacitor scaffold (`capacitor.config.ts`, `ios/`, shared icons via `npm run ios:sync-assets`) — `fe5ac82`

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
