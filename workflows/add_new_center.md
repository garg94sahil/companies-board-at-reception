# Workflow: Onboard a new center

**Objective:** Stand up the reception-screen creative for an entirely new Haus+ center, live on its own GitHub Pages site.

## Policy: every new center gets its own repo

As of the Okhla Phase III rollout, **every new center is a brand-new GitHub repo with its own GitHub Pages deployment** — not a `centers/<slug>/` folder added to this shared repo. This repo (`companies-board-at-reception`) now specifically hosts Salcon Rasvilas (its original, already-live center) and isn't the default home for anything new. One repo per location means each center's roster, design tweaks, and deploy history stay isolated — no risk of one center's change (or a bad push) affecting another's live screen.

## Inputs needed
- The center's name and a URL-safe slug for it (e.g. "Okhla Phase III" → `okhla-phase-iii`).
- The list of tenant companies at that center (names, websites) — typically from the account owner's roster Google Sheet (one tab per center); see `sync_roster_from_sheet.md`.
- The repo name for the new center (e.g. `okhla-phase-iii-reception`) and which design it needs (this repo's `main` — Option 1: card grid, moving gradient — unless told otherwise).

## Steps

1. **Scaffold a new repo folder**, copying the reusable core unchanged from an existing center repo: `index.html`, `css/style.css`, `js/app.js`, `assets/` (shared fonts + Haus+ wordmark), `tools/add_client_logo.py`, `tools/sync_roster_from_sheet.py`, `workflows/add_reception_client.md`, `workflows/sync_roster_from_sheet.md`, `requirements.txt`, `.gitignore`. Write a new `README.md` describing it as a single-center repo (see `okhla-phase-iii-reception/README.md` for the pattern).

2. **Set `DEFAULT_CENTER` in `js/app.js`** to the new center's slug, so the bare Pages URL works with no `?center=` query param — a dedicated repo serves exactly one location.

3. **Add each tenant company** by following `add_reception_client.md`'s steps 1-3 (find logo → `python tools/add_client_logo.py ... --center <slug>` → preview) for every company. This creates `centers/<slug>/` on first run.

4. **Preview the whole center** at `http://localhost:8080/?center=<slug>` and sanity-check all logos together (sizing, legibility, no name collisions).

5. **Init git, create the GitHub repo, and push:**
   ```
   git init && git add . && git commit -m "..."
   gh repo create garg94sahil/<repo-name> --public --source=. --push
   ```

6. **Enable GitHub Pages** on the new repo: `gh api repos/garg94sahil/<repo-name>/pages -X POST -f "source[branch]=main" -f "source[path]=/"`. Poll `gh api repos/garg94sahil/<repo-name>/pages` until `status` is `built` (usually under a minute), then verify the live URL: `https://garg94sahil.github.io/<repo-name>/`.

## Notes
- Fonts and the Haus+ logo are shared brand assets at each repo's root (`assets/`) — copy them into every new center repo, never reference across repos.
- If a company has no usable logo yet, the screen falls back to rendering their name as text (see `client-card__name-fallback` in `css/style.css`) — not ideal long-term, but unblocks getting a center live while a logo is sourced.
- A center needing a different design (e.g. the `option-2-warp-background` warp-tunnel look) is no different from any other new center now — it's just another standalone repo, scaffolded from whichever design branch it needs.
