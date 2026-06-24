# iOS App Store — Capacitor wrapper

Nyx Fit ships to the App Store as a **Capacitor** native shell loading the deployed PWA at `https://fit.webdevsam.pro` (same remote-URL model as Android TWA).

## Capacitor vs PWABuilder

| | **Capacitor** (chosen) | PWABuilder |
|---|------------------------|------------|
| Fit with TanStack Start SSR | ✅ `server.url` loads live deployment | ⚠️ PWABuilder iOS packages are deprecated / limited |
| Parity with Android TWA | ✅ Both wrap the hosted PWA | ❌ Different toolchain per platform |
| Native plugins later | ✅ Status bar, splash, push (future batch) | Limited |
| Team familiarity | Mentioned in `ai/features.md` | One-off generator |

**Decision (2026-06-23):** Use **Capacitor 7** for the iOS wrapper. PWABuilder was not selected because its iOS output is unmaintained and our app requires SSR + Convex auth against the production host.

## Files

| Path | Purpose |
|------|---------|
| `builds/ios-config.json` | Bundle ID, host, icon paths (shared with scripts) |
| `capacitor.config.ts` | Capacitor app config (`server.url` → production) |
| `resources/icon.png` | App icon (synced from `public/favicon/`) |
| `resources/splash.png` | Launch splash (synced from `public/splash/`) |
| `scripts/sync-ios-assets.mjs` | Regenerates `resources/` from PWA assets |
| `ios/` | Xcode project (generated; build requires macOS) |

## Prerequisites

- **macOS** with Xcode 15+ and CocoaPods
- **Apple Developer Program** membership (stop condition — not required for scaffold)
- Node.js 20+

## One-time setup (on Mac)

```bash
npm install
npm run ios:sync-assets
npx cap add ios          # if ios/ not present
npx cap sync ios
```

Open in Xcode:

```bash
npm run ios:open
```

Set **Signing & Capabilities** → Team → your Apple Developer team. Bundle identifier: `pro.webdevsam.fit`.

## Asset sync

After changing PWA icons or splash screens:

```bash
npm run ios:sync-assets
npx cap sync ios
```

Icons mirror `vite.config.ts` manifest entries (`web-app-manifest-512x512.png`, splash PNGs).

## Local development

Point Capacitor at the Vite dev server (uncomment in `capacitor.config.ts` or use env):

```typescript
server: {
  url: 'http://localhost:3000',
  cleartext: true,
},
```

Run `npm run dev` and `npx cap run ios` on a simulator.

## App Store submission

1. Archive in Xcode (Product → Archive)
2. Upload via Organizer / Transporter
3. App Store Connect: category **Health & Fitness**, privacy policy URL `https://fit.webdevsam.pro/privacy`
4. Screenshots: 6.7" and 6.5" iPhone (390×844 content matches Phase 2 QA)

Play Billing and push notifications remain **disabled** until explicit monetization/notification batches.

## CI note

iOS builds cannot run on Linux CI without a Mac runner. Use Xcode Cloud, GitHub Actions `macos-latest`, or local archive for release builds.
