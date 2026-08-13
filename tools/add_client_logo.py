#!/usr/bin/env python3
"""Normalize a client logo and register it in a center's clients.json.

Usage:
    python tools/add_client_logo.py <source_image> "<Client Name>" <website_url> --center <center-slug>

Example:
    python tools/add_client_logo.py ~/Downloads/acme-logo.png "Acme Inc" https://acme.com --center salcon-rasvilas

What it does:
- Pads the source image onto a transparent canvas with a consistent margin,
  capped to a max width/height, so every card on the reception screen has
  matching visual weight regardless of the source logo's native aspect ratio.
- Saves the result as PNG into centers/<center>/logos/<slug>.png
- Appends (or updates, if the name already exists) the entry in
  centers/<center>/clients.json (creating that center's folder/file if this
  is its first client).

Finding the right source logo file is a judgment call (press kit vs. header
vs. footer, light-background vs. dark-background variant) and is NOT handled
by this script -- see workflows/add_reception_client.md.
"""

import argparse
import json
import re
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent

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


def upsert_client(clients_json: Path, name: str, logo_rel_path: str, website: str) -> None:
    clients = json.loads(clients_json.read_text()) if clients_json.exists() else []

    entry = {"name": name, "logo": logo_rel_path, "website": website}
    for i, c in enumerate(clients):
        if c["name"].strip().lower() == name.strip().lower():
            clients[i] = entry
            break
    else:
        clients.append(entry)

    clients_json.parent.mkdir(parents=True, exist_ok=True)
    clients_json.write_text(json.dumps(clients, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source_image")
    parser.add_argument("client_name")
    parser.add_argument("website_url")
    parser.add_argument("--center", required=True, help="center slug, e.g. salcon-rasvilas")
    args = parser.parse_args()

    src_path = Path(args.source_image).expanduser()
    if not src_path.exists():
        parser.error(f"Source image not found: {src_path}")

    center_dir = REPO_ROOT / "centers" / args.center
    logos_dir = center_dir / "logos"
    clients_json = center_dir / "clients.json"

    slug = slugify(args.client_name)
    dest_path = logos_dir / f"{slug}.png"
    normalize_logo(src_path, dest_path)

    logo_rel_path = f"centers/{args.center}/logos/{dest_path.name}"
    upsert_client(clients_json, args.client_name, logo_rel_path, args.website_url)

    print(f"Saved {dest_path} and updated {clients_json} for '{args.client_name}'.")


if __name__ == "__main__":
    main()
