# Companies Board at Reception

A looping, animated "companies board" for Haus+ managed-office reception screens — shows the Haus+ brand and the logos of every current tenant company at a given center. Built as a reusable template: one codebase, one folder per center.

Delivery is via **GitHub Pages** — each reception screen's browser points directly at the live page: `https://garg94sahil.github.io/companies-board-at-reception/?center=<slug>`. There's no export or upload step; pushing a change to `main` updates every screen once Pages rebuilds (usually under a minute).

Two designs exist as branches: `main` (Option 1 — card grid, moving gradient background) and `option-2-warp-background` (Option 2 — same cards, indigo warp-tunnel background). GitHub Pages only serves one branch live at a time, so all centers in *this* repo get whatever design is on `main`. A center needing Option 2 needs its own separate repo + Pages deployment.

## What it is

A static page (`index.html`), no build step, no framework. It reads `?center=<slug>` from the URL (defaults to `salcon-rasvilas`), fetches that center's `centers/<slug>/clients.json`, renders one card per client with a staggered entrance animation, keeps the background in slow ambient motion, and reshuffles the card order every 25s so a long-running loop doesn't feel static.

## Running it locally

```
python -m http.server 8080
```
then open `http://localhost:8080/?center=<slug>` (e.g. `?center=salcon-rasvilas`).

(A plain `file://` open won't work — the page `fetch()`s `clients.json`, which browsers block from `file://` due to CORS. For a quick double-click-able preview, see the standalone preview HTML files kept in the parent project folder.)

## Adding a client / a new center

- New client at an existing center: [`workflows/add_reception_client.md`](workflows/add_reception_client.md).
- Brand-new center: [`workflows/add_new_center.md`](workflows/add_new_center.md).

Short version for a client:
```
python tools/add_client_logo.py <logo-file> "<Client Name>" <website-url> --center <center-slug>
```
then commit and push — the live screen picks it up automatically.

## Structure

```
index.html                      the screen itself (reads ?center= from the URL)
css/style.css                    layout, Haus+ brand colors, animations
js/app.js                        renders a center's clients.json into cards + reshuffle cycle + hourly reload
assets/haus-logo/                Haus+ wordmark (shared across all centers)
assets/fonts/                    Manrope + Bricolage Grotesque (shared brand fonts)
centers/<slug>/clients.json      that center's client list (name, logo path, website)
centers/<slug>/logos/            that center's client logos
tools/add_client_logo.py         normalizes a new logo + updates a center's clients.json
workflows/add_reception_client.md   SOP for onboarding a new client
workflows/add_new_center.md         SOP for onboarding a whole new center
```

## Brand reference

- Haus Mitti `#5A0A2D` · Haus Indigo `#82B4FF` · Haus Concrete `#EFEFEF`
- Fonts: Manrope (body), Bricolage Grotesque (headings)

This repo intentionally only contains the small subset of brand assets the page actually uses. The full brand library (Illustrator source files, guidelines, sales collateral) lives outside this repo and isn't published here.
