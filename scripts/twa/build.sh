#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILDS_DIR="$ROOT_DIR/builds"
MANIFEST="$BUILDS_DIR/twa-manifest.json"

cd "$ROOT_DIR"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing $MANIFEST" >&2
  exit 1
fi

if [[ -z "${TWA_KEYSTORE_BASE64:-}" && ! -f "$BUILDS_DIR/android.keystore" ]]; then
  echo "No signing keystore found." >&2
  echo "For CI: set TWA_KEYSTORE_BASE64. For local builds: place builds/android.keystore (gitignored)." >&2
  exit 1
fi

if [[ -n "${TWA_KEYSTORE_BASE64:-}" ]]; then
  echo "$TWA_KEYSTORE_BASE64" | base64 -d > "$BUILDS_DIR/android.keystore"
fi

: "${TWA_KEYSTORE_PASSWORD:?Set TWA_KEYSTORE_PASSWORD}"
: "${TWA_KEY_ALIAS:=android}"
: "${TWA_KEY_PASSWORD:=${TWA_KEYSTORE_PASSWORD}}"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Installing @bubblewrap/cli..." >&2
  npm install -g @bubblewrap/cli
fi

cd "$BUILDS_DIR"

bubblewrap update --manifest "$MANIFEST" --yes

bubblewrap build \
  --manifest "$MANIFEST" \
  --signingKeyPath "$BUILDS_DIR/android.keystore" \
  --signingKeyAlias "$TWA_KEY_ALIAS" \
  --signingKeyPassword "$TWA_KEY_PASSWORD"

echo "Build artifacts:"
ls -la app-release-bundle.aab app-release-signed.apk 2>/dev/null || true
