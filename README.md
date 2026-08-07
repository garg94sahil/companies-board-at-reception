# Haus+ Reception Screen

A looping, animated welcome screen for the Haus+ reception TV — shows the Haus+ brand and the logos of every current client company.

Live at: **https://garg94sahil.github.io/haus-plus-reception-screen/**

## What it is

A single static page (`index.html`), no build step, no framework. It reads `clients.json`, renders one card per client, plays a staggered entrance animation on load, and keeps a slow ambient background glow moving so the screen never looks frozen. It auto-reloads once an hour, which is standard practice for an unattended kiosk display — it recovers from any transient JS error and always picks up the latest deployed `clients.json`.

## Running it locally

```
python -m http.server 8080
```
then open `http://localhost:8080/`.

(A plain `file://` open won't work — the page `fetch()`s `clients.json`, which browsers block from `file://` due to CORS.)

## Adding a new client

See [`workflows/add_reception_client.md`](workflows/add_reception_client.md). Short version:
```
python tools/add_client_logo.py <logo-file> "<Client Name>" <website-url>
```
then commit and push — GitHub Pages redeploys automatically.

## Structure

```
index.html            the screen itself
css/style.css          layout, Haus+ brand colors, animations
js/app.js               renders clients.json into cards + hourly reload
clients.json            the client list (name, logo path, website)
assets/haus-logo/       Haus+ wordmark
assets/fonts/           Manrope + Bricolage Grotesque (brand fonts)
assets/clients/         per-client logos
tools/add_client_logo.py   normalizes a new logo + updates clients.json
workflows/add_reception_client.md   SOP for onboarding a new client
```

## Brand reference

- Haus Mitti `#5A0A2D` · Haus Indigo `#82B4FF` · Haus Concrete `#EFEFEF`
- Fonts: Manrope (body), Bricolage Grotesque (headings)

This repo intentionally only contains the small subset of brand assets the page actually uses. The full brand library (Illustrator source files, guidelines, sales collateral) lives outside this repo and isn't published here.
