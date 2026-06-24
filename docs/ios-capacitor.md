# iOS wrapper — Capacitor

Nyx Fit uses **Ionic Capacitor** for the App Store iOS wrapper (Phase 5). Android ships as a **TWA** (Bubblewrap); iOS uses a native WKWebView shell that loads the deployed web app.

## Why Capacitor over PWABuilder

| | Capacitor | PWABuilder (iOS) |
|---|-----------|------------------|
| Maintenance | Active Ionic ecosystem, plugins, docs | Limited iOS packaging; Microsoft-focused |
| SSR / Convex | `server.url` loads `https://fit.webdevsam.pro` | Assumes static PWA; poor fit for TanStack Start SSR |
| Shared assets | `npm run ios:sync-assets` from PWA icons | Separate icon pipeline |
| Store path | Standard Xcode archive → App Store Connect | Extra wrapper tooling, less control |
| Future native APIs | Plugins (haptics, status bar, etc.) | Minimal |

**Decision:** Capacitor — aligns with existing PWA assets, supports remote SSR deployment, and matches the Android TWA pattern (web app + native shell).

## Prerequisites

- macOS with Xcode (not required for scaffold; required to build/archive)
- Apple Developer account (stop condition — not needed for scaffold)
- Production deploy at `https://fit.webdevsam.pro`

## Scaffold layout

```
capacitor.config.ts     # app id, server.url, webDir shell
capacitor-web/          # minimal index.html for cap sync
ios/                    # Xcode project (Capacitor-generated)
scripts/sync-ios-assets.mjs
```

## Commands

```bash
# Sync web shell + native project (after build optional for remote URL mode)
npm run ios:sync

# Copy PWA icons → ios/App/App/Assets.xcassets
npm run ios:sync-assets

# Open in Xcode (macOS only)
npm run ios:open
```

### Local dev against Vite

```bash
npm run dev
CAPACITOR_SERVER_URL=http://localhost:3000 npm run ios:sync
npm run ios:open
```

## App Store checklist (manual)

1. Export **1024×1024** App Store icon (current sync uses 512×512 placeholder).
2. Set bundle ID `pro.webdevsam.fit` in Xcode signing.
3. Privacy policy URL: `https://fit.webdevsam.pro/privacy`
4. Archive → Upload to App Store Connect.

## Stop conditions

- Apple Developer Program enrollment
- Provisioning profiles / signing certificates
- App Store review metadata and screenshots

Do not commit signing keys or provisioning profiles.
