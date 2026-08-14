# Workflow: Onboard a new center

**Objective:** Stand up the reception-screen creative for an entirely new Haus+ center, live on this repo's GitHub Pages site.

## Inputs needed
- The center's name and a URL-safe slug for it (e.g. "Salcon Rasvilas" → `salcon-rasvilas`).
- The list of tenant companies at that center (names, websites).
- Which design the center needs — see the Design note below before assuming it's this repo's `main`.

## Steps

1. **Add each tenant company** by following `add_reception_client.md`'s steps 1-3 (find logo → `python tools/add_client_logo.py ... --center <new-center-slug>` → preview) for every company. This creates `centers/<new-center-slug>/` on first run.

2. **Preview the whole center** at `http://localhost:8080/?center=<new-center-slug>` and sanity-check all logos together (sizing, legibility, no name collisions).

3. **Commit and push** the new `centers/<new-center-slug>/` folder. Point the new center's screen at `https://garg94sahil.github.io/companies-board-at-reception/?center=<new-center-slug>`; it goes live once GitHub Pages finishes rebuilding (usually under a minute).

## Design
This repo has two designs on separate branches (`main` — Option 1: card grid, moving gradient; `option-2-warp-background` — Option 2: indigo warp tunnel), but GitHub Pages only serves one branch live at a time, to every center in this repo. A new center that wants `main`'s design is just another `centers/<slug>/` folder here. A center that needs Option 2 (or any other design) needs its own separate repo + GitHub Pages deployment — branch-switching within this repo is no longer a per-center delivery option now that delivery is a single live URL.

## Notes
- Fonts and the Haus+ logo are shared brand assets at the repo root (`assets/`) — never duplicate these per center.
- If a company has no usable logo yet, the screen falls back to rendering their name as text (see `client-card__name-fallback` in `css/style.css`) — not ideal long-term, but unblocks getting a center live while a logo is sourced.
