#!/usr/bin/env node
/**
 * Records a center's reception screen and exports a signage-ready looping MP4.
 *
 * Usage:
 *   node record-loop.mjs --center <slug> [--duration 180] [--out <path>]
 *
 * Example:
 *   node record-loop.mjs --center salcon-rasvilas
 *
 * What it does:
 * 1. Serves the repo root locally (python -m http.server).
 * 2. Opens index.html?center=<slug> in system Edge via Playwright, recording video
 *    from just before navigation so the CSS entrance animation isn't missed.
 * 3. Records for --duration seconds (default 180 -- these renders play in an
 *    endless loop all day on the signage screen, so the export needs several
 *    card-reshuffle cycles baked in, not just one; see js/app.js's
 *    SHUFFLE_INTERVAL_MS (25s) -- 180s covers ~6 reshuffles before the loop
 *    repeats, instead of flip-flopping between the same two orderings.
 * 4. Transcodes the raw .webm capture to a constant-framerate H.264 .mp4 via the
 *    ffmpeg-static bundled binary (no system ffmpeg / admin rights needed).
 *
 * Records at a native 2160x3840 (4K) viewport rather than a smaller viewport
 * scaled up via deviceScaleFactor: Playwright's video recorder captures frames
 * at the viewport's own CSS pixel size regardless of deviceScaleFactor, so a
 * 1080x1920 viewport + deviceScaleFactor:2 does NOT produce a 2160x3840
 * recording -- it produces a 1080x1920 recording padded with blank space into
 * a larger requested recordVideo.size (this was tried and produced a video
 * that was only sharp -- and only had content -- in its top-left quadrant).
 *
 * A native 4K viewport in turn breaks css/style.css's min(Xvw, Ypx) patterns,
 * which were tuned for a ~1080px-wide viewport (e.g. .client-card's 460px
 * cap) -- at 2160px wide, those same px caps clip twice as aggressively
 * relative to the canvas, shrinking cards/logos to half their intended
 * relative size. Rather than editing the shared stylesheet (which also drives
 * the live preview page at whatever size a browser window happens to be),
 * this script injects a page-scoped style override via page.addStyleTag()
 * that redeclares just those px caps scaled up by SCALE, only for the
 * recording session -- see STYLE_OVERRIDE below.
 *
 * Raw/intermediate files are written to the OS temp dir (not the OneDrive-synced
 * project folder) to avoid file-lock churn while ffmpeg/Playwright are writing;
 * only the finished .mp4 is copied into tools/video/out/.
 */

import { chromium } from "playwright-core";
import ffmpegPath from "ffmpeg-static";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(__dirname, "out");

const PORT = 8934;
const DESIGN_WIDTH = 1080; // the viewport width css/style.css's px caps were tuned for
const WIDTH = 2160;
const HEIGHT = 3840;
const SCALE = WIDTH / DESIGN_WIDTH; // 2 -- how much to scale up the design's fixed-px caps

// Recording-only overrides of css/style.css's fixed-px size caps, scaled for
// the native 4K viewport. Injected via page.addStyleTag() so the shared
// stylesheet (and the live preview page it serves) is untouched.
const STYLE_OVERRIDE = `
  .brand__logo { width: min(46vw, ${420 * SCALE}px); }
  .client-card { width: min(54vw, ${460 * SCALE}px); border-radius: ${18 * SCALE}px; }
  .client-card__logo-wrap { height: ${88 * SCALE}px; }
  .client-card__name-fallback { font-size: clamp(${24 * SCALE}px, 4vw, ${40 * SCALE}px); }
`;

function parseArgs(argv) {
  const args = { duration: 180 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--center") args.center = argv[++i];
    else if (argv[i] === "--duration") args.duration = Number(argv[++i]);
    else if (argv[i] === "--out") args.out = argv[++i];
  }
  if (!args.center) {
    console.error("Usage: node record-loop.mjs --center <slug> [--duration 180] [--out <path>]");
    process.exit(1);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  const server = spawn("py", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: REPO_ROOT,
    shell: false,
    stdio: "ignore",
  });
  return server;
}

async function waitForServer(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "reception-video-"));

  console.log(`Starting local server on port ${PORT}...`);
  const server = startServer();

  try {
    const indexUrl = `http://127.0.0.1:${PORT}/index.html`;
    await waitForServer(indexUrl);

    console.log(`Launching Edge...`);
    const browser = await chromium.launch({ channel: "msedge", headless: true });

    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      recordVideo: { dir: scratchDir, size: { width: WIDTH, height: HEIGHT } },
    });
    const page = await context.newPage();

    const pageUrl = `${indexUrl}?center=${encodeURIComponent(args.center)}`;
    console.log(`Recording ${pageUrl} for ${args.duration}s...`);

    const t0 = Date.now();
    await page.goto(pageUrl, { waitUntil: "load" });
    await page.addStyleTag({ content: STYLE_OVERRIDE });
    await page.waitForSelector(".client-card", { state: "attached" });

    const remainingMs = args.duration * 1000 - (Date.now() - t0);
    await page.waitForTimeout(Math.max(remainingMs, 0));

    const video = page.video();
    await context.close(); // flushes the .webm file
    const rawWebmPath = await video.path();
    await browser.close();

    const fixedWebmPath = path.join(scratchDir, "raw.webm");
    fs.renameSync(rawWebmPath, fixedWebmPath);

    console.log("Transcoding to MP4...");
    const mp4ScratchPath = path.join(scratchDir, "reception-loop.mp4");
    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", fixedWebmPath,
      "-vf", `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=disable,fps=30,format=yuv420p`,
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "21",
      "-profile:v", "high",
      "-level", "5.1",
      "-movflags", "+faststart",
      "-an",
      mp4ScratchPath,
    ]);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const finalPath = args.out
      ? path.resolve(args.out)
      : path.join(OUT_DIR, `${args.center}.mp4`);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.copyFileSync(mp4ScratchPath, finalPath);

    const { size } = fs.statSync(finalPath);
    console.log(`Done: ${finalPath} (${(size / 1024 / 1024).toFixed(1)}MB)`);
  } finally {
    server.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
