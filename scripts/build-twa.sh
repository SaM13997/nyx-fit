#!/usr/bin/env bash
# Build signed TWA APK/AAB with Bubblewrap (Docker image includes Android SDK).
# Requires: builds/android.keystore and BUBBLEWRAP_KEYSTORE_PASSWORD.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILDS_DIR="$ROOT/builds"

if [[ -z "${BUBBLEWRAP_KEYSTORE_PASSWORD:-}" ]]; then
	echo "BUBBLEWRAP_KEYSTORE_PASSWORD is required." >&2
	exit 1
fi

export BUBBLEWRAP_KEY_PASSWORD="${BUBBLEWRAP_KEY_PASSWORD:-$BUBBLEWRAP_KEYSTORE_PASSWORD}"

if [[ ! -f "$BUILDS_DIR/android.keystore" ]]; then
	echo "Missing $BUILDS_DIR/android.keystore — decode ANDROID_KEYSTORE_BASE64 in CI or generate locally." >&2
	exit 1
fi

docker run --rm \
	--entrypoint bash \
	-v "$BUILDS_DIR":/workspace \
	-w /workspace \
	-e BUBBLEWRAP_KEYSTORE_PASSWORD \
	-e BUBBLEWRAP_KEY_PASSWORD \
	ghcr.io/googlechromelabs/bubblewrap:latest \
	-c '
		set -euo pipefail
		if [[ ! -f settings.gradle ]]; then
			echo "Initializing Bubblewrap project..."
			yes "" | bubblewrap init --manifest https://fit.webdevsam.pro/manifest.json --directory .
		fi
		bubblewrap update --manifest .
		yes "" | bubblewrap build --skipPwaValidation \
			--manifest . \
			--signingKeyPath android.keystore \
			--signingKeyAlias android
	'

echo "TWA build artifacts:"
ls -lh "$BUILDS_DIR"/app-release-signed.apk "$BUILDS_DIR"/app-release-bundle.aab
