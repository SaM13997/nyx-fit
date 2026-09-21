#!/usr/bin/env python3
"""Generate iOS splash screens from the app icon on a black background."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICON_PATH = ROOT / "public" / "favicon" / "web-app-manifest-512x512.png"
OUT_DIR = ROOT / "public" / "favicon" / "splash"

# Common iOS portrait splash sizes (width x height)
SPLASH_SIZES = [
    (750, 1334),   # iPhone SE / 8
    (1170, 2532),  # iPhone 14 / 13 / 12
    (1179, 2556),  # iPhone 14 Pro
    (1284, 2778),  # iPhone 14 Plus
    (1290, 2796),  # iPhone 14 Pro Max
    (1536, 2048),  # iPad portrait
    (1668, 2388),  # iPad Pro 11"
    (2048, 2732),  # iPad Pro 12.9"
]

BG_COLOR = (0, 0, 0)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    icon = Image.open(ICON_PATH).convert("RGBA")

    for width, height in SPLASH_SIZES:
        canvas = Image.new("RGB", (width, height), BG_COLOR)
        icon_size = min(width, height) // 3
        resized = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        x = (width - icon_size) // 2
        y = (height - icon_size) // 2
        canvas.paste(resized, (x, y), resized)
        out_path = OUT_DIR / f"splash-{width}x{height}.png"
        canvas.save(out_path, "PNG", optimize=True)
        print(f"Wrote {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
