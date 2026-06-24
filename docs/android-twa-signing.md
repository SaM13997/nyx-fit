# Android TWA signing & Digital Asset Links

Nyx Fit ships as a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) (`pro.webdevsam.fit.twa`) backed by the PWA at `https://fit.webdevsam.pro`.

## Files

| Path | Purpose |
|------|---------|
| `builds/twa-manifest.json` | Bubblewrap source manifest (host, theme, manifest URL) |
| `public/.well-known/assetlinks.json` | Digital Asset Links served by the web app |
| `scripts/twa/build.sh` | CI/local Bubblewrap build entrypoint |
| `scripts/twa/print-signing-fingerprint.sh` | Print SHA-256 fingerprint from upload keystore |

## Keystore (never commit)

The upload keystore is **not** stored in git. Generate one locally or in a secure secrets manager:

```bash
keytool -genkeypair \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore builds/android.keystore \
  -storepass "$TWA_KEYSTORE_PASSWORD" \
  -keypass "$TWA_KEY_PASSWORD" \
  -dname "CN=Nyx Fitness, OU=Mobile, O=Nyx Fit, L=Unknown, ST=Unknown, C=US"
```

Keep `builds/android.keystore` local only (see `.gitignore`).

## Digital Asset Links

Google verifies TWA ownership via `/.well-known/assetlinks.json`. The SHA-256 fingerprint in that file **must** match the certificate used to sign the Play Store upload/AAB.

Verify your keystore fingerprint:

```bash
export TWA_KEYSTORE_PASSWORD='your-store-password'
bash scripts/twa/print-signing-fingerprint.sh
```

Update `public/.well-known/assetlinks.json` if the fingerprint changes (e.g. new upload key).

Current production fingerprint (colon-separated, uppercase):

`E3:D4:CF:67:E0:21:51:AA:5A:7D:B8:DA:1F:D4:86:F8:EB:D9:6F:3F:A0:9C:5A:92:39:81:CE:6D:20:E6:70:1C`

## GitHub Actions secrets

Configure these repository secrets for `.github/workflows/twa-build.yml`:

| Secret | Description |
|--------|-------------|
| `TWA_KEYSTORE_BASE64` | Base64-encoded `android.keystore` file |
| `TWA_KEYSTORE_PASSWORD` | Keystore store password |
| `TWA_KEY_ALIAS` | Key alias (default: `android`) |
| `TWA_KEY_PASSWORD` | Key password (often same as store password) |

Encode keystore for CI:

```bash
base64 -w0 builds/android.keystore
```

## Local Bubblewrap build

```bash
export TWA_KEYSTORE_PASSWORD='...'
export TWA_KEY_PASSWORD='...'   # optional if same as store password
export TWA_KEY_ALIAS=android
bash scripts/twa/build.sh
```

Outputs (gitignored): `builds/app-release-bundle.aab`, `builds/app-release-signed.apk`.

## Bubblewrap update after PWA changes

When the live web manifest or theme changes:

1. Deploy the PWA to `https://fit.webdevsam.pro`
2. Update `builds/twa-manifest.json` if host, colors, or `webManifestUrl` changed
3. Run `bash scripts/twa/build.sh` (or trigger the GitHub workflow)
4. Upload the new AAB in Play Console

## Stop conditions

- Play Console developer account access
- Production Convex deploy
- Rotating upload keys without updating `assetlinks.json`

These require human action outside this repo.
