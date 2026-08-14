# Companies Board at Reception

A looping, animated "companies board" for Haus+ managed-office reception screens — shows the Haus+ brand and the logos of every current tenant company at a given center. Built as a reusable template: one codebase, one folder per center.

Delivery is via **AbleSign** (digital signage) — this repo renders each center's board to an `.mp4` video and uploads it straight to AbleSign's media library via their API (see `tools/video/`). Assigning the uploaded video to a screen is a manual step done in the AbleSign CMS.

Two designs exist as branches: `main` (Option 1 — card grid, moving gradient background) and `option-2-warp-background` (Option 2 — same cards, indigo warp-tunnel background). Both work for any center.

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
then, from `tools/video/`:
```
node record-loop.mjs --center <center-slug>
node upload-to-ablesign.mjs --center <center-slug>
```
then assign the uploaded video to the center's screen yourself in the AbleSign CMS.

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
tools/video/record-loop.mjs      records the live page and exports a signage-ready .mp4
tools/video/upload-to-ablesign.mjs  uploads a rendered video into AbleSign's media library
.env.example                     template for .env (needs ABLESIGN_API_KEY)
workflows/add_reception_client.md   SOP for onboarding a new client
workflows/add_new_center.md         SOP for onboarding a whole new center
```

## Brand reference

- Haus Mitti `#5A0A2D` · Haus Indigo `#82B4FF` · Haus Concrete `#EFEFEF`
- Fonts: Manrope (body), Bricolage Grotesque (headings)

This repo intentionally only contains the small subset of brand assets the page actually uses. The full brand library (Illustrator source files, guidelines, sales collateral) lives outside this repo and isn't published here.
