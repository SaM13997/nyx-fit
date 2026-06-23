# Android TWA — Keystore, Asset Links & CI

Nyx Fit ships to the Play Store as a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) wrapping `https://fit.webdevsam.pro`.

## Files

| Path | Purpose |
|------|---------|
| `builds/twa-manifest.json` | Bubblewrap config (host, theme, signing key path) |
| `builds/assetlinks.config.json` | Single source for Digital Asset Links fingerprints |
| `public/assetlinks.json` | Served at `/.well-known/assetlinks.json` (Vercel rewrite) |
| `scripts/sync-assetlinks.mjs` | Regenerates both assetlinks files from config |
| `scripts/build-twa.sh` | Docker + Bubblewrap signed APK/AAB build |
| `.github/workflows/twa-build.yml` | CI workflow (secrets only, no keystore in repo) |

## Generate a release keystore

```bash
keytool -genkeypair -v \
  -keystore builds/android.keystore \
  -alias android \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Nyx Fit, OU=Mobile, O=Nyx Fitness, L=Unknown, ST=Unknown, C=US"
```

**Never commit** `builds/android.keystore`. It is listed in `.gitignore`.

## Print SHA-256 fingerprint

After creating or rotating a keystore, print the release fingerprint:

```bash
export ANDROID_KEYSTORE_PASSWORD='your-store-password'
./scripts/print-keystore-fingerprint.sh
```

Update **both**:

1. `builds/assetlinks.config.json` → `sha256CertFingerprints`
2. `builds/twa-manifest.json` → `fingerprints`

Then sync public files:

```bash
npm run twa:sync-assetlinks
```

Verify with [Google's Asset Links tool](https://developers.google.com/digital-asset-links/tools/generator).

## GitHub Actions secrets

Configure these repository secrets before running the TWA workflow:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `builds/android.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password → `BUBBLEWRAP_KEYSTORE_PASSWORD` |
| `ANDROID_KEY_PASSWORD` | Key password (often same as store password) |
| `ANDROID_KEY_ALIAS` | Key alias (default: `android`) |

Encode keystore for CI:

```bash
base64 -w0 builds/android.keystore
```

## Local TWA build

```bash
export BUBBLEWRAP_KEYSTORE_PASSWORD='your-store-password'
export BUBBLEWRAP_KEY_PASSWORD='your-key-password'  # optional if same as store
./scripts/build-twa.sh
```

Outputs (gitignored):

- `builds/app-release-signed.apk`
- `builds/app-release-bundle.aab`

## CI

Workflow: **Build Android TWA** (`.github/workflows/twa-build.yml`)

- Trigger: `workflow_dispatch` or changes under `builds/**`
- Decodes keystore from `ANDROID_KEYSTORE_BASE64`
- Runs `scripts/build-twa.sh` via Bubblewrap Docker image
- Uploads signed APK/AAB as artifacts (30-day retention)

Play Billing and web push are **disabled** in `twa-manifest.json` until monetization/notifications batches land.
