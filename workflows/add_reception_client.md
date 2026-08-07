# Workflow: Add a client to the reception screen

**Objective:** Onboard a new tenant company onto the Haus+ reception screen (`index.html`) so their logo and name appear in the client grid.

## Inputs needed
- The client's official display name (confirm with the account owner — company logos and website title tags often use a group/parent brand name that differs from the trading name on the lease, e.g. a site's logo may read "Acme Group" even though the tenant signed as "Acme Laminates").
- Their website URL.
- A usable logo image.

## Steps

1. **Find a logo suited for a light card background.**
   The reception screen renders every client logo on a white card, so you need a version with dark/colored artwork (not a white-only logo meant for dark backgrounds). Check, in order:
   - The site's footer (often has a "dark" or alternate-color logo variant, e.g. `logo-dark.webp`) — usually the best fit.
   - The site's header/nav (sometimes only a white/light logo meant for a dark navbar — skip if so).
   - A press/media kit page, if the site has one.
   - View page source and search for `logo` in image `src` attributes; for JS-rendered sites (React/Vue/Next), the raw HTML won't show it — fetch the built JS bundle instead and grep it for `logo.*\.(png|svg|webp|jpg)`.
   Download the file locally.

2. **Normalize it and register it** by running:
   ```
   python tools/add_client_logo.py <path-to-downloaded-logo> "<Client Name>" <website-url>
   ```
   This pads the logo onto a transparent canvas (preserving its aspect ratio) and adds/updates its entry in `clients.json`. It does NOT pick the logo for you — that's step 1.

3. **Preview locally before pushing:**
   ```
   python -m http.server 8080
   ```
   then open `http://localhost:8080/` in a browser. Confirm: the logo is legible against the white card, the entrance animation plays once on load, and the name matches what's on the logo (don't caption a "VIRGO GROUP" logo as "Virgolam" — pick one and keep them consistent).

4. **Commit and push to `main`.** GitHub Pages redeploys automatically — no manual deploy step. Give it 1-2 minutes, then reload the live Pages URL to confirm.

## Notes / lessons learned
- `add_client_logo.py` pads proportionally to the logo's own aspect ratio, not a fixed square — a first version used a square canvas and it shrank wide wordmarks down to a sliver in a mostly-empty box. If logos ever look tiny/off-center on the card again, check `MAX_DIM`/`MARGIN_RATIO` in that script first.
- Logos fetched from JS-rendered (Next.js/Vite/React) sites won't appear in the raw `curl`'d HTML — you have to pull the bundled JS file the page loads and grep it for the asset filename instead.
