# Android TWA — Keystore & CI

Signing keys for the Play Store TWA (`pro.webdevsam.fit.twa`) must **never** be committed. Use GitHub Actions secrets for CI builds.

## Generate a release keystore (one-time, local)

```bash
keytool -genkeypair \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore builds/android.keystore \
  -storetype PKCS12
```

Store the keystore password and key password securely (password manager / GitHub secrets).

## Extract SHA-256 fingerprint

The fingerprint must match `public/.well-known/assetlinks.json` so Android can verify Digital Asset Links.

```bash
export TWA_KEYSTORE_PASSWORD='your-store-password'
npm run twa:fingerprint
```

Or set the fingerprint directly:

```bash
export TWA_SHA256_FINGERPRINT='AA:BB:...'
npm run twa:sync-assetlinks
git diff public/assetlinks.json public/.well-known/assetlinks.json
```

Deploy the updated asset links to production (`https://fit.webdevsam.pro/.well-known/assetlinks.json`) before publishing the TWA.

## Verify asset links

```bash
npm run twa:validate-assetlinks
# With release fingerprint:
TWA_SHA256_FINGERPRINT='AA:BB:...' npm run twa:validate-assetlinks
```

[Google Asset Links tester](https://developers.google.com/digital-asset-links/tools/generator) — confirm `fit.webdevsam.pro` ↔ `pro.webdevsam.fit.twa`.

## GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `TWA_KEYSTORE_BASE64` | Base64-encoded `android.keystore` file |
| `TWA_KEYSTORE_PASSWORD` | Keystore store password |
| `TWA_KEY_PASSWORD` | Key password (often same as store password) |
| `TWA_SHA256_FINGERPRINT` | SHA-256 cert fingerprint (colon-separated, uppercase) |

Encode keystore for CI:

```bash
base64 -w0 builds/android.keystore
# macOS: base64 -i builds/android.keystore
```

## Local Bubblewrap build

Prerequisites: JDK 17+, Android SDK, `@bubblewrap/cli`.

```bash
npm install -g @bubblewrap/cli   # or: npx @bubblewrap/cli
cd builds
bubblewrap update
bubblewrap build
```

Outputs (gitignored): `app-release-bundle.aab`, `app-release-signed.apk`.

## CI workflow

`.github/workflows/twa-android.yml` builds a signed AAB on `workflow_dispatch` or pushes to `dev` that touch `builds/`. Secrets are decoded at runtime; nothing sensitive is stored in the repo.

## TWA manifest

`builds/twa-manifest.json` is aligned with the live PWA:

- `webManifestUrl`: `https://fit.webdevsam.pro/manifest.json`
- Theme / background: `#000000` (matches `vite.config.ts`)
- `enableNotifications`: `false` (web push not enabled yet)
- Play Billing: not enabled

Bump `appVersionCode` / `appVersionName` before each Play Store upload.
