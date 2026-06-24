#!/usr/bin/env bash
# Build signed TWA APK/AAB with Bubblewrap. Run from repo root.
# Requires: JDK 17+, Android SDK (ANDROID_HOME), @bubblewrap/cli, decoded keystore.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILDS_DIR="$ROOT/builds"
KEYSTORE_PATH="${TWA_KEYSTORE_PATH:-$BUILDS_DIR/android.keystore}"
KEY_ALIAS="${TWA_KEY_ALIAS:-android}"

if [[ ! -f "$KEYSTORE_PATH" ]]; then
	echo "error: keystore missing at $KEYSTORE_PATH" >&2
	echo "Decode TWA_KEYSTORE_BASE64 or generate per docs/android-twa-signing.md" >&2
	exit 1
fi

if [[ -z "${TWA_KEYSTORE_PASSWORD:-}" ]]; then
	echo "error: TWA_KEYSTORE_PASSWORD is required" >&2
	exit 1
fi

cd "$BUILDS_DIR"

if [[ ! -f settings.gradle ]]; then
	echo "Initializing Bubblewrap project from twa-manifest.json..."
	bubblewrap init \
		--manifest ./twa-manifest.json \
		--directory . \
		--chromeosonly false \
		--alphaDependencies false
fi

echo "Updating TWA project from twa-manifest.json..."
bubblewrap update --manifest ./twa-manifest.json --skipPwaValidation

echo "Building signed release..."
bubblewrap build \
	--skipPwaValidation \
	--signingKeyPath "$KEYSTORE_PATH" \
	--signingKeyAlias "$KEY_ALIAS" \
	--signingKeyPassword "$TWA_KEYSTORE_PASSWORD"

echo "Done. Artifacts:"
ls -la app-release-bundle.aab app-release-signed.apk 2>/dev/null || true
