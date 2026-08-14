# Workflow: Onboard a new center

**Objective:** Stand up the reception-screen creative for an entirely new Haus+ center, from a list of its tenant companies to a finished video uploaded to AbleSign.

## Inputs needed
- The center's name and a URL-safe slug for it (e.g. "Salcon Rasvilas" → `salcon-rasvilas`).
- The list of tenant companies at that center (names, websites).
- Which design to use — `main` branch (Option 1: card grid, moving gradient) or `option-2-warp-background` branch (Option 2: card grid, indigo warp tunnel). Both work for any center; the choice is purely visual preference, made once per rollout unless told otherwise.

## Steps

1. **Check out the chosen design's branch** (`main` or `option-2-warp-background`).

2. **Add each tenant company** by following `add_reception_client.md`'s steps 1-3 (find logo → `python tools/add_client_logo.py ... --center <new-center-slug>` → preview) for every company. This creates `centers/<new-center-slug>/` on first run.

3. **Preview the whole center** at `http://localhost:8080/?center=<new-center-slug>` and sanity-check all logos together (sizing, legibility, no name collisions).

4. **Render the video**: from `tools/video/`, run
   ```
   node record-loop.mjs --center <new-center-slug>
   ```
   Produces a signage-ready `.mp4` (see `tools/video/README` / `record-loop.mjs` header for exact output path and flags).

5. **Commit and push** the new `centers/<new-center-slug>/` folder.

6. **Upload the video as content**: from `tools/video/`, run
   ```
   node upload-to-ablesign.mjs --center <new-center-slug>
   ```
   This uploads the rendered video into AbleSign's media library. Assigning it to the center's screen, and creating that screen in AbleSign if it doesn't exist yet, is a manual step done in the AbleSign CMS. Re-run step 4 + this step any time the center's roster changes.

## Notes
- Fonts and the Haus+ logo are shared brand assets at the repo root (`assets/`) — never duplicate these per center.
- If a company has no usable logo yet, the screen falls back to rendering their name as text (see `client-card__name-fallback` in `css/style.css`) — not ideal long-term, but unblocks getting a center live while a logo is sourced.
