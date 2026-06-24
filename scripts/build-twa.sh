#!/usr/bin/env bash
# Build signed Nyx Fit TWA from builds/twa-manifest.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/builds"

if [[ -n "${TWA_KEYSTORE_BASE64:-}" ]]; then
	echo "$TWA_KEYSTORE_BASE64" | base64 -d > android.keystore
fi

if [[ ! -f android.keystore ]]; then
	echo "Missing builds/android.keystore — set TWA_KEYSTORE_BASE64 or copy keystore locally." >&2
	exit 1
fi

export BUBBLEWRAP_KEYSTORE_PASSWORD="${BUBBLEWRAP_KEYSTORE_PASSWORD:-${TWA_KEYSTORE_PASSWORD:-}}"
export BUBBLEWRAP_KEY_PASSWORD="${BUBBLEWRAP_KEY_PASSWORD:-${TWA_KEY_PASSWORD:-}}"

if [[ -z "$BUBBLEWRAP_KEYSTORE_PASSWORD" || -z "$BUBBLEWRAP_KEY_PASSWORD" ]]; then
	echo "Set BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD (or TWA_* equivalents)." >&2
	exit 1
fi

npx --yes @bubblewrap/cli@latest update \
	--manifest=twa-manifest.json \
	--skipPwaValidation

npx --yes @bubblewrap/cli@latest build \
	--manifest=twa-manifest.json \
	--signingKeyPath=./android.keystore \
	--signingKeyAlias="${TWA_KEY_ALIAS:-android}" \
	--skipPwaValidation

echo "Built: builds/app-release-bundle.aab"
