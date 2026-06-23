# Nyx Fit — PWA & App Store Publish Checklist

Track progress toward installable PWA, Play Store (TWA), and iOS wrapper. Work in **one batch per automation run** using the [Agent batching map](#agent-batching-map).

**Last completed batch:** A — PR [#16](https://github.com/SaM13997/nyx-fit/pull/16) / `325bc05` (2026-06-23)

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

- [x] `vite-plugin-pwa` is the only manifest author (no stale `public/manifest.json`) — `325bc05`
- [x] `manifestFilename` is `manifest.json` (TWA / Bubblewrap compatible) — `325bc05`
- [x] `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation` match brand — `325bc05`

### 1.2 Icons (192 + 512, any + maskable)

- [x] Icons reference `/favicon/web-app-manifest-192x192.png` and `512x512` — `325bc05`
- [x] Both `any` and `maskable` purposes declared — `325bc05`
- [x] Favicon set linked in root head (`favicon.ico`, `favicon.svg`, `favicon-96x96`) — `325bc05`

### 1.3 Apple touch icon

- [x] `apple-touch-icon` points to `/favicon/apple-touch-icon.png` (180×180) — `325bc05`

### 1.4 Apple meta tags

- [x] `apple-mobile-web-app-title` = Nyx Fitness — `325bc05`
- [x] `apple-mobile-web-app-capable` = yes — `325bc05`
- [x] `apple-mobile-web-app-status-bar-style` = black-translucent — `325bc05`
- [x] `theme-color` = `#000000` (dark-first) — `325bc05`

### 1.5 Head manifest link

- [x] Root route links `rel="manifest"` → `/manifest.json` (generated at build) — `325bc05`

### 1.6 Splash screens _(Batch B)_

- [ ] iOS / Android splash assets or meta where applicable

### 1.7 Offline shell _(Batch B)_

- [ ] Service worker caches app shell; offline UX acceptable

### 1.8 Install prompt _(Batch B)_

- [ ] `InstallPrompt` styled on-brand; dismiss + install flows work

### 1.9 Lighthouse PWA _(Batch B)_

- [ ] Lighthouse PWA audit passes on production preview build

---

## Phase 2 — Mobile QA _(Batch E)_

- [ ] 390×844 viewport: home, workouts, weights, settings — no overflow
- [ ] Bottom nav safe area; tap targets ≥ 44px
- [ ] Auth: login, session persist, logout
- [ ] Settings: profile, appearance, rest timer

---

## Phase 3 — Legal _(Batch C)_

- [ ] `/privacy` page with store-ready privacy policy
- [ ] `/terms` page with terms of service
- [ ] Links from settings / install flows

---

## Phase 4 — Android TWA _(Batch D)_

### 4.1 Digital Asset Links

- [ ] `/.well-known/assetlinks.json` matches release signing key

### 4.2 Keystore documentation

- [ ] Keystore generation + CI secrets documented (no secrets in repo)

### 4.3 Bubblewrap / TWA manifest

- [ ] `builds/twa-manifest.json` aligned with live manifest URL and theme

### 4.4 CI build APK/AAB

- [ ] Workflow builds signed bundle (secrets in CI only)

---

## Phase 5 — iOS wrapper _(Batch F)_

- [ ] Capacitor chosen over PWABuilder — document in `docs/ios-capacitor.md`
- [ ] Minimal Capacitor scaffold (`capacitor.config.ts`, `ios/`, shared icons)

---

## Notes

- Do **not** enable Play Billing or web push unless a batch explicitly covers them.
- Convex production deploy, keystore secrets, and store developer accounts are **stop conditions** — report in Slack, do not mark items complete.
