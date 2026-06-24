# iOS wrapper (Capacitor)

Nyx Fit is a server-rendered TanStack Start + Convex PWA. The iOS App Store build uses a **thin native shell** that loads the production web app—same strategy as the Android TWA.

## Decision: Capacitor (not PWABuilder iOS)

| Option | Verdict |
|--------|---------|
| **Capacitor** | **Chosen.** WKWebView wrapper, remote `server.url`, native plugins later (haptics, safe area), standard Xcode archive flow. |
| PWABuilder iOS | Not chosen. Focused on packaged PWAs; less alignment with our SSR + auth cookie model and future native hooks. |
| Expo / React Native rewrite | Out of scope for store v1; keep the web app as source of truth. |

## Layout

| Path | Purpose |
|------|---------|
| `capacitor.config.ts` | App id, remote server URL, dark background |
| `capacitor-web/` | Minimal offline fallback (`webDir`) |
| `ios/` | Xcode project (generated via Capacitor CLI) |
| `scripts/ios/sync-icons.sh` | Copies PWA icons into the iOS asset catalog |

## Prerequisites (stop conditions)

These are **not** in CI and require a Mac + Apple Developer account:

- Xcode 15+ and CocoaPods (`gem install cocoapods`)
- Apple Developer Program membership ($99/yr)
- App Store Connect app record for `pro.webdevsam.fit`
- Signing certificate + provisioning profile

Do not commit certificates, `.p12` files, or provisioning profiles.

## First-time setup (on macOS)

```bash
npm install
npm run ios:icons
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Set **Team** and **Bundle Identifier** (`pro.webdevsam.fit`).
2. Confirm **App Icons** include the synced Nyx assets.
3. Archive → Distribute → App Store Connect.

## Remote URL vs bundled web assets

Production loads `https://fit.webdevsam.pro` (see `server.url` in `capacitor.config.ts`). The web app remains the single deploy surface; the wrapper only provides the store listing and native chrome.

Local dev against a machine on the LAN:

```bash
CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync ios
```

## Icons

Icons are sourced from the same files as the PWA manifest:

- `public/favicon/web-app-manifest-1024x1024.png` (if present) or 512×512
- `public/favicon/apple-touch-icon.png` (180×180)

Run `npm run ios:icons` after updating favicon assets, then `npx cap sync ios`.

## Versioning

Keep `CFBundleShortVersionString` / `CFBundleVersion` in Xcode aligned with `builds/twa-manifest.json` `appVersion` for cross-platform release notes.

## Related docs

- [PWA checklist](./pwa-store-publish-checklist.md)
- [Android TWA signing](./android-twa-signing.md)
