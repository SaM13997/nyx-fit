# iOS wrapper (Capacitor)

Nyx Fit ships on iOS as a **Capacitor** shell that loads the hosted PWA at `https://fit.webdevsam.pro`, mirroring the Android [TWA](android-twa-signing.md) approach (native wrapper + live web app).

## Decision: Capacitor over PWABuilder

| Criterion | Capacitor | PWABuilder |
|-----------|-----------|------------|
| Repo-friendly scaffold | `capacitor.config.ts` + `ios/` in git | Xcode project via web UI download |
| Hosted PWA (SSR) | `server.url` loads production site | Same, but less scriptable |
| Parity with Android TWA | Thin wrapper, shared manifest URL | Similar, but outside monorepo |
| Future native APIs | Plugins (HealthKit, haptics, etc.) | Limited |
| CI / team workflow | `npx cap sync ios`, documented scripts | Manual re-download on changes |

**Chosen:** Capacitor 7 — version-controlled config, remote URL for TanStack Start SSR, and room to add native plugins later without replacing the wrapper.

PWABuilder remains a valid fallback if you prefer a one-off Xcode export and do not need Capacitor plugins.

## Shared manifest & icons

- **Manifest source of truth:** `vite.config.ts` → `manifest.json` at build; live URL `https://fit.webdevsam.pro/manifest.json` (same as `builds/twa-manifest.json` → `webManifestUrl`).
- **Icons:** `public/favicon/web-app-manifest-*.png`, `apple-touch-icon.png`, and `public/splash/apple-splash-*.png`.
- **Sync script:** `npm run ios:assets` copies favicon/splash assets into `ios/App/App/Assets.xcassets/` (run after `npx cap add ios` on macOS).

## Project layout

```
capacitor.config.ts     # app id, remote server URL, splash colors
ios/                    # Xcode project (generated via cap add ios)
scripts/sync-ios-assets.mjs
builds/ios-capacitor.json   # alignment metadata (bundle id, manifest URL)
```

## Local setup (requires macOS + Xcode)

```bash
npm install
npm run build          # ensures webDir exists for cap sync
npx cap add ios        # first time only
npm run ios:assets     # copy shared icons/splash into Xcode assets
npx cap sync ios
npx cap open ios       # Archive in Xcode for TestFlight / App Store
```

### Development against local server

In `capacitor.config.ts`, temporarily set:

```ts
server: {
  url: 'http://YOUR_LAN_IP:3000',
  cleartext: true,
}
```

Revert before App Store archive so the wrapper loads production.

## App Store stop conditions

Do **not** mark store submission complete in automation. These require human accounts and are out of scope for the scaffold batch:

- Apple Developer Program enrollment
- App Store Connect app record + screenshots
- Provisioning profiles & distribution certificate
- App Review privacy questionnaire (links to `/privacy` and `/terms` are already in the web app)

## Bundle identifier

- **iOS:** `pro.webdevsam.fit` (Capacitor `appId`)
- **Android TWA:** `pro.webdevsam.fit.twa` (Play package id)
