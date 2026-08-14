# Workflow: Sync a center's roster from a Google Sheet

**Objective:** Keep a center's `clients.json` in sync with a Google Sheet the account owner maintains directly, instead of relaying company names/websites by hand every time.

No Google API, credentials, or auth involved — the sync tool just fetches the sheet's plain CSV export URL over HTTP. That only works if the sheet's sharing is set to "Anyone with the link can view," so it's for non-sensitive data only (company names/websites bound for a public lobby display already qualifies).

## One-time setup (per center)

1. **Create the sheet**: a normal Google Sheet, with a header row `Company Name` | `Website` on its first tab. Optionally pre-fill it with the center's current roster.
2. **Share it**: top-right Share button > General access > **Anyone with the link** > Viewer.
3. **Note the sheet ID**: the long string in its URL, `https://docs.google.com/spreadsheets/d/<sheet-id>/edit`. If you're not using the first tab, also note the `gid=` value from the URL when that tab is open.
4. **Install dependencies** (if not already): `pip install -r requirements.txt`.

## Ongoing sync (whenever the account owner has updated the sheet)

```
python tools/sync_roster_from_sheet.py --center <center-slug> --sheet-id <sheet-id>
```

- **Removed rows** and **website URL changes** are fully mechanical — the script applies these directly to `clients.json` (and deletes the logo file for any removed company).
- **New rows** are only reported, not added — finding and vetting the right logo is a judgment call (see `add_reception_client.md`), not something this script does. For each new company it prints, follow that workflow's steps 1-2 (find a logo suited for a light background, then `python tools/add_client_logo.py ...`).
- After syncing, preview locally (`python -m http.server 8080`) before committing/pushing, same as any other roster change.

## Notes
- The header row is always skipped (first row of whichever tab `--gid` points at, default `0` — the first tab).
- Matching between sheet rows and `clients.json` entries is by company name (case-insensitive) — renaming a company in the sheet will look like a removal + a new addition, not a rename.
- The sheet is readable by anyone with its link, though it's not discoverable/indexed. Don't reuse this sheet for anything beyond company name + website.
