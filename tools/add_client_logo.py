#!/usr/bin/env python3
"""Normalize a client logo and register it in clients.json.

Usage:
    python tools/add_client_logo.py <source_image> "<Client Name>" <website_url>

Example:
    python tools/add_client_logo.py ~/Downloads/acme-logo.png "Acme Inc" https://acme.com

What it does:
- Pads the source image onto a transparent canvas with a consistent margin,
  capped to a max width/height, so every card on the reception screen has
  matching visual weight regardless of the source logo's native aspect ratio.
- Saves the result as PNG into assets/clients/<slug>.png
- Appends (or updates, if the name already exists) the entry in clients.json

Finding the right source logo file is a judgment call (press kit vs. header
vs. footer, light-background vs. dark-background variant) and is NOT handled
by this script -- see workflows/add_reception_client.md.
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
CLIENTS_JSON = REPO_ROOT / "clients.json"
CLIENTS_DIR = REPO_ROOT / "assets" / "clients"

MAX_DIM = 480        # longest side of the logo itself (before margin), in px
MARGIN_RATIO = 0.12  # empty margin added around the logo, as a fraction of its own size


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "client"


def normalize_logo(src_path: Path, dest_path: Path) -> None:
    """Downscale to MAX_DIM and pad with a proportional margin, preserving
    the logo's native aspect ratio (a square canvas would shrink wide
    wordmarks down to a sliver inside a mostly-empty box)."""
    img = Image.open(src_path).convert("RGBA")
    img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    margin = int(max(img.width, img.height) * MARGIN_RATIO)
    canvas = Image.new("RGBA", (img.width + 2 * margin, img.height + 2 * margin), (0, 0, 0, 0))
    canvas.paste(img, (margin, margin), img)

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest_path, "PNG", optimize=True)


def upsert_client(name: str, logo_rel_path: str, website: str) -> None:
    clients = json.loads(CLIENTS_JSON.read_text()) if CLIENTS_JSON.exists() else []

    entry = {"name": name, "logo": logo_rel_path, "website": website}
    for i, c in enumerate(clients):
        if c["name"].strip().lower() == name.strip().lower():
            clients[i] = entry
            break
    else:
        clients.append(entry)

    CLIENTS_JSON.write_text(json.dumps(clients, indent=2) + "\n")


def main() -> None:
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    src_path, name, website = Path(sys.argv[1]).expanduser(), sys.argv[2], sys.argv[3]
    if not src_path.exists():
        print(f"Source image not found: {src_path}")
        sys.exit(1)

    slug = slugify(name)
    dest_path = CLIENTS_DIR / f"{slug}.png"
    normalize_logo(src_path, dest_path)

    logo_rel_path = f"assets/clients/{dest_path.name}"
    upsert_client(name, logo_rel_path, website)

    print(f"Saved {dest_path} and updated clients.json for '{name}'.")


if __name__ == "__main__":
    main()
