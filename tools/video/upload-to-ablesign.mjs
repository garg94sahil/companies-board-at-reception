#!/usr/bin/env node
/**
 * Uploads a rendered center video to AbleSign's media library as content.
 * Does NOT assign it to a screen -- that's done manually in the AbleSign CMS.
 *
 * Usage:
 *   node upload-to-ablesign.mjs --center <slug> [--file <path>]
 *
 * Example:
 *   node upload-to-ablesign.mjs --center salcon-rasvilas
 *
 * What it does (AbleSign API: https://apidocs.ablesign.tv/):
 * 1. POST /media_files/init_upload  -> signed upload URL + uploadId
 * 2. PUT the file to that signed URL
 * 3. POST /media_files/finish_upload -> media file id
 *
 * Rate limits (per AbleSign's docs) -- don't loop this across many centers
 * without pacing: media uploads are capped at 200/day per organization.
 * A 413 means the org storage cap is hit; a 400 means the file itself was
 * rejected (bad format/size). Both come back as the response body, which
 * this script prints verbatim rather than swallowing into a generic error.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const API_BASE = "https://api.ablesign.tv/api/v1";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--center") args.center = argv[++i];
    else if (argv[i] === "--file") args.file = argv[++i];
  }
  if (!args.center) {
    console.error("Usage: node upload-to-ablesign.mjs --center <slug> [--file <path>]");
    process.exit(1);
  }
  return args;
}

function loadEnv() {
  const envPath = path.join(REPO_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function ablesignRequest(apiKey, method, urlPath, body) {
  const res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} -> ${res.status}: ${text}`);
  }
  const parsed = text ? JSON.parse(text) : {};
  return parsed.data ?? parsed;
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.ABLESIGN_API_KEY;
  if (!apiKey) {
    console.error("ABLESIGN_API_KEY is not set. Add it to .env (see .env.example).");
    process.exit(1);
  }

  const filePath = args.file
    ? path.resolve(args.file)
    : path.join(__dirname, "out", `${args.center}.mp4`);
  if (!fs.existsSync(filePath)) {
    console.error(`Video file not found: ${filePath}. Render it first with record-loop.mjs.`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  console.log(`Initiating upload of ${filename} (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB)...`);
  const init = await ablesignRequest(apiKey, "POST", "/media_files/init_upload", {
    filename,
    mimeType: "video/mp4",
    size: fileBuffer.length,
  });

  console.log("Uploading to storage...");
  const uploadRes = await fetch(init.url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fileBuffer,
  });
  if (!uploadRes.ok) {
    throw new Error(`PUT to signed upload URL -> ${uploadRes.status}: ${await uploadRes.text()}`);
  }

  console.log("Finalizing upload...");
  const finished = await ablesignRequest(apiKey, "POST", "/media_files/finish_upload", {
    uploadId: init.uploadId,
  });

  console.log(`Done: media file ${finished.id} is in AbleSign's media library. Assign it to a screen in the AbleSign CMS.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
