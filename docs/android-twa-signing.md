# Android TWA signing & Digital Asset Links

Nyx Fit ships to Google Play as a **Trusted Web Activity** (TWA) built with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). This doc covers keystore generation, CI secrets, and keeping `assetlinks.json` in sync.

## Package & host

| Field | Value |
|-------|--------|
| Package ID | `pro.webdevsam.fit.twa` |
| PWA host | `fit.webdevsam.pro` |
| Web manifest | `https://fit.webdevsam.pro/manifest.json` |
| Asset links | `https://fit.webdevsam.pro/.well-known/assetlinks.json` |

Vercel rewrites `/.well-known/assetlinks.json` → `/assetlinks.json` (see `vercel.json`).

## Generate a release keystore (one-time, local)

**Never commit the keystore or passwords.** Store them in a password manager and GitHub Actions secrets.

```bash
keytool -genkeypair \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore builds/android.keystore \
  -storetype PKCS12
```

`builds/android.keystore` is gitignored. Copy the file to secure storage after generation.

## Print SHA256 fingerprint

Required for Digital Asset Links (`public/.well-known/assetlinks.json`):

```bash
export TWA_KEYSTORE_PASSWORD='your-store-password'
export TWA_KEY_ALIAS=android   # optional, default: android

keytool -list -v \
  -keystore builds/android.keystore \
  -alias "$TWA_KEY_ALIAS" \
  -storepass "$TWA_KEYSTORE_PASSWORD" \
  | grep SHA256
```

Update **both** `public/.well-known/assetlinks.json` and `public/assetlinks.json` with the colon-separated fingerprint (uppercase hex with `:` separators).

Verify locally:

```bash
export TWA_KEYSTORE_PASSWORD='your-store-password'
node scripts/verify-assetlinks.mjs
```

## GitHub Actions secrets

Configure these in the repository (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `TWA_KEYSTORE_BASE64` | Base64-encoded `builds/android.keystore` file |
| `TWA_KEYSTORE_PASSWORD` | Keystore store password |
| `TWA_KEY_ALIAS` | Key alias (default: `android`) |

Encode keystore for CI:

```bash
base64 -w0 builds/android.keystore   # Linux
# macOS: base64 -i builds/android.keystore
```

The workflow `.github/workflows/twa-build.yml` decodes the keystore at build time, verifies asset links, then runs Bubblewrap. **Secrets never appear in the repo.**

## Local Bubblewrap build

Prerequisites: JDK 17+, Android SDK (`ANDROID_HOME`), Bubblewrap CLI.

```bash
npm install -g @bubblewrap/cli
export TWA_KEYSTORE_PASSWORD='your-store-password'
export TWA_KEY_ALIAS=android
./scripts/build-twa.sh
```

Signed artifacts are written under `builds/` (`app-release-bundle.aab`, `app-release-signed.apk`).

## TWA manifest

`builds/twa-manifest.json` is the Bubblewrap source of truth. It must stay aligned with the live PWA:

- `webManifestUrl` → production `manifest.json`
- `themeColor` / `backgroundColor` → `#000000` (matches `vite.config.ts`)
- `signingKey.path` → `android.keystore` (relative to `builds/`)
- Play Billing and web push stay **disabled** until a dedicated monetization/notifications batch

After editing `twa-manifest.json`, run `bubblewrap update` or `./scripts/build-twa.sh`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| TWA opens in Chrome tab, not fullscreen | Fingerprint mismatch — re-run `verify-assetlinks.mjs` and redeploy `assetlinks.json` |
| `bubblewrap build` signing fails | Check `TWA_KEYSTORE_PASSWORD` and alias |
| PWA validation errors in CI | Ensure production site is live; workflow uses `--skipPwaValidation` for PR builds |

## Related

- [PWA store checklist](./pwa-store-publish-checklist.md) — Phase 4 (Batch D)
- [Google Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
