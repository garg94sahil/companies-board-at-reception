#!/usr/bin/env python3
"""Diffs a center's roster Google Sheet against centers/<slug>/clients.json.

No Google API/auth involved -- the sheet must have its sharing set to
"Anyone with the link can view", and this fetches its plain CSV export URL
over HTTP. Fine for this data (company names/websites for a public lobby
display), not for anything sensitive.

Removals and website-URL changes are fully mechanical, so this applies them
directly (and deletes the logo file for any removed company). New companies
are only *reported*, not added -- finding and vetting the right logo is a
judgment call, not handled by this script (see workflows/add_reception_client.md
and tools/add_client_logo.py).

Usage:
    python tools/sync_roster_from_sheet.py --center <slug> --sheet-id <id> [--gid 0]

--sheet-id is the long ID in the sheet's URL:
    https://docs.google.com/spreadsheets/d/<sheet-id>/edit#gid=<gid>
--gid defaults to 0 (the first tab). The sheet needs a header row
"Company Name" | "Website" -- the first row is always skipped.
"""

import argparse
import csv
import json
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def fetch_sheet_rows(sheet_id: str, gid: str) -> list[tuple[str, str]]:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    with urllib.request.urlopen(url) as res:
        if res.status != 200:
            raise SystemExit(
                f"Fetching the sheet failed ({res.status}). Make sure its sharing is set to "
                '"Anyone with the link can view".'
            )
        text = res.read().decode("utf-8-sig")

    rows = list(csv.reader(text.splitlines()))[1:]  # skip header row
    return [
        (row[0].strip(), row[1].strip() if len(row) > 1 else "")
        for row in rows
        if row and row[0].strip()
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--center", required=True, help="center slug, e.g. salcon-rasvilas")
    parser.add_argument("--sheet-id", required=True, help="Google Sheet ID (from its URL)")
    parser.add_argument("--gid", default="0", help="tab gid (default: 0, the first tab)")
    args = parser.parse_args()

    clients_json = REPO_ROOT / "centers" / args.center / "clients.json"
    clients = json.loads(clients_json.read_text()) if clients_json.exists() else []
    by_name = {c["name"].strip().lower(): c for c in clients}

    sheet_rows = fetch_sheet_rows(args.sheet_id, args.gid)

    if not sheet_rows and clients:
        raise SystemExit(
            "The sheet came back with zero data rows, but clients.json currently has "
            f"{len(clients)} compan{'y' if len(clients) == 1 else 'ies'}. Refusing to treat "
            "that as \"remove everyone\" -- this is almost always an empty/misconfigured sheet, "
            "not an intentional wipe. Check the sheet has data in its first tab (or the tab "
            "--gid points at), then re-run."
        )

    sheet_by_name = {name.lower(): (name, website) for name, website in sheet_rows}

    new_companies = [sheet_by_name[key] for key in sheet_by_name if key not in by_name]
    removed_companies = [c for key, c in by_name.items() if key not in sheet_by_name]
    website_changes = [
        (by_name[key]["name"], by_name[key]["website"], website)
        for key, (_, website) in sheet_by_name.items()
        if key in by_name and by_name[key]["website"] != website
    ]

    if removed_companies or website_changes:
        removed_keys = {c["name"].strip().lower() for c in removed_companies}
        updated = [c for c in clients if c["name"].strip().lower() not in removed_keys]
        for c in updated:
            key = c["name"].strip().lower()
            if key in sheet_by_name:
                c["website"] = sheet_by_name[key][1]
        for removed in removed_companies:
            logo_path = REPO_ROOT / removed["logo"]
            if logo_path.exists():
                logo_path.unlink()
                print(f"Deleted logo: {logo_path}")
        clients_json.write_text(json.dumps(updated, indent=2) + "\n")

    print(f"New companies (need a logo sourced + added via add_client_logo.py): {len(new_companies)}")
    for name, website in new_companies:
        print(f"  + {name} -- {website}")
    print(f"Removed (applied): {len(removed_companies)}")
    for c in removed_companies:
        print(f"  - {c['name']}")
    print(f"Website changes (applied): {len(website_changes)}")
    for name, old, new in website_changes:
        print(f"  ~ {name}: {old} -> {new}")


if __name__ == "__main__":
    main()
