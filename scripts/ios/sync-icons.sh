#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ICON_SRC="$ROOT/public/favicon/web-app-manifest-512x512.png"
ICON_FALLBACK="$ROOT/public/favicon/apple-touch-icon.png"
IOS_APPICON="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [[ ! -d "$IOS_APPICON" ]]; then
  echo "iOS project not found at $IOS_APPICON — run: npx cap add ios && npx cap sync ios"
  exit 1
fi

if [[ -f "$ICON_SRC" ]]; then
  SOURCE="$ICON_SRC"
elif [[ -f "$ICON_FALLBACK" ]]; then
  SOURCE="$ICON_FALLBACK"
  echo "Using apple-touch-icon.png (512 manifest icon missing)"
else
  echo "No icon source found under public/favicon/"
  exit 1
fi

cp "$SOURCE" "$IOS_APPICON/AppIcon-512@2x.png"

cat >"$IOS_APPICON/Contents.json" <<'EOF'
{
  "images": [
    {
      "filename": "AppIcon-512@2x.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
EOF

echo "Synced iOS app icon from $(basename "$SOURCE")"
