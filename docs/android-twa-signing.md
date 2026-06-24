# Android TWA signing & Digital Asset Links

Nyx Fit ships as a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/) (TWA) built with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). The web app lives at `https://fit.webdevsam.pro`; the Android package id is `pro.webdevsam.fit.twa`.

## Keystore (never commit secrets)

The release keystore **must not** be committed. `builds/android.keystore` is gitignored. Use CI secrets or a local file for signing.

### Generate a new release keystore (one-time)

```bash
keytool -genkeypair \
  -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12
```

Store the keystore password, key password, and alias securely. Upload the keystore to GitHub Actions as base64:

```bash
base64 -w0 android.keystore   # Linux
base64 -i android.keystore    # macOS
```

### Print SHA-256 for Digital Asset Links

After signing credentials are available:

```bash
keytool -list -v \
  -keystore builds/android.keystore \
  -alias android \
  -storepass "$TWA_KEYSTORE_PASSWORD"
```

Copy the **SHA-256** certificate fingerprint (colon-separated) into:

- `public/assetlinks.json`
- `public/.well-known/assetlinks.json`
- `builds/twa-manifest.json` → `fingerprints[].sha256Fingerprint`

Verify locally or in CI:

```bash
TWA_KEYSTORE_PASSWORD=... TWA_KEY_ALIAS=android node scripts/verify-assetlinks.mjs
```

Current release fingerprint (must match the keystore used for Play Store uploads):

`E3:D4:CF:67:E0:21:51:AA:5A:7D:B8:DA:1F:D4:86:F8:EB:D9:6F:3F:A0:9C:5A:92:39:81:CE:6D:20:E6:70:1C`

## GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `TWA_KEYSTORE_BASE64` | Base64-encoded release keystore file |
| `TWA_KEYSTORE_PASSWORD` | Keystore password |
| `TWA_KEY_ALIAS` | Key alias (default: `android`) |
| `TWA_KEY_PASSWORD` | Key password (often same as keystore password) |

Workflow: `.github/workflows/twa-build.yml` (manual or on `builds/**` changes).

## Local TWA build

Prerequisites: JDK 17+, Android SDK (Bubblewrap can install via `bubblewrap doctor`).

```bash
# Place keystore at builds/android.keystore
export BUBBLEWRAP_KEYSTORE_PASSWORD='...'
export BUBBLEWRAP_KEY_PASSWORD='...'

./scripts/build-twa.sh
```

Outputs (gitignored):

- `builds/app-release-bundle.aab` — upload to Play Console
- `builds/app-release-signed.apk` — sideload / QA

## Asset Links hosting

`vercel.json` rewrites `/.well-known/assetlinks.json` → `/assetlinks.json`. After changing the fingerprint, deploy the web app so Chrome can verify the TWA.

Validate: [Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator)

## TWA manifest

Source of truth for Bubblewrap: `builds/twa-manifest.json`

- `webManifestUrl` → live PWA manifest (`https://fit.webdevsam.pro/manifest.json`)
- Theme/background colors match `vite.config.ts` (`#000000`, dark-first)
- Play Billing and notification delegation are **disabled** until a dedicated monetization/notifications batch enables them.

Regenerate Android sources after manifest edits:

```bash
cd builds && npx @bubblewrap/cli update --manifest=twa-manifest.json --skipPwaValidation
```
