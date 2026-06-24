#!/usr/bin/env bash
set -euo pipefail

# Prints the SHA-256 certificate fingerprint for the TWA upload keystore.
# Use the output to verify public/.well-known/assetlinks.json stays in sync.

KEYSTORE_PATH="${TWA_KEYSTORE_PATH:-builds/android.keystore}"
KEY_ALIAS="${TWA_KEY_ALIAS:-android}"

if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "Keystore not found at $KEYSTORE_PATH" >&2
  echo "Set TWA_KEYSTORE_PATH or place the release keystore at builds/android.keystore (local only; never commit)." >&2
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "keytool is required (install a JDK)." >&2
  exit 1
fi

STOREPASS="${TWA_KEYSTORE_PASSWORD:-}"
if [[ -z "$STOREPASS" ]]; then
  read -r -s -p "Keystore password: " STOREPASS
  echo
fi

keytool -list -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -storepass "$STOREPASS" \
  | awk -F': ' '/SHA256:/{gsub(/ /,"",$2); print $2; exit}'
