#!/usr/bin/env bash
# Print SHA-256 fingerprint for Digital Asset Links (assetlinks.json).
# Usage: ANDROID_KEYSTORE_PASSWORD=*** ./scripts/print-keystore-fingerprint.sh [keystore] [alias]

set -euo pipefail

KEYSTORE="${1:-builds/android.keystore}"
ALIAS="${2:-${ANDROID_KEY_ALIAS:-android}}"

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
	echo "Set ANDROID_KEYSTORE_PASSWORD (and optionally ANDROID_KEY_ALIAS)." >&2
	exit 1
fi

if [[ ! -f "$KEYSTORE" ]]; then
	echo "Keystore not found: $KEYSTORE" >&2
	exit 1
fi

keytool -list -v \
	-keystore "$KEYSTORE" \
	-alias "$ALIAS" \
	-storepass "$ANDROID_KEYSTORE_PASSWORD" \
	| awk -F': ' '/SHA256:/{gsub(/ /,"",$2); print $2; exit}'
