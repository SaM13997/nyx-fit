#!/usr/bin/env node
/**
 * Run Lighthouse PWA category against a local preview URL.
 * Usage: node scripts/lighthouse-pwa.mjs [url]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.argv[2] ?? "http://localhost:4173";
const outDir = path.join(root, ".lighthouse");
const reportPath = path.join(outDir, "pwa-report.json");

await mkdir(outDir, { recursive: true });

const args = [
  url,
  "--only-categories=pwa",
  "--chrome-flags=--headless --no-sandbox --disable-gpu",
  "--output=json",
  `--output-path=${reportPath}`,
  "--quiet",
];

// Lighthouse 12+ removed the PWA category; pin v11 for installability audits.
const LIGHTHOUSE_PKG = "lighthouse@11.7.1";

const exitCode = await new Promise((resolve) => {
  const child = spawn("npx", [LIGHTHOUSE_PKG, ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  child.on("close", resolve);
});

if (exitCode !== 0) {
  console.error(`lighthouse exited with code ${exitCode}`);
  process.exit(exitCode ?? 1);
}

const report = JSON.parse(await import("node:fs").then((fs) => fs.promises.readFile(reportPath, "utf8")));
const pwaScore = report.categories?.pwa?.score ?? null;
const audits = report.audits ?? {};

if (pwaScore === null) {
  console.error(
    "Lighthouse report has no PWA category (use lighthouse@11; v12+ removed it)."
  );
  process.exit(1);
}

const pwaAuditIds = report.categories?.pwa?.auditRefs?.map((ref) => ref.id) ?? [];
const failed = pwaAuditIds
  .map((id) => [id, audits[id]])
  .filter(([, audit]) => audit && audit.score !== null && audit.score < 1)
  .map(([id, audit]) => ({ id, title: audit.title, score: audit.score }));

const summary = {
  url,
  pwaScore,
  passed: pwaScore === 1,
  failedAudits: failed,
};

await writeFile(path.join(outDir, "pwa-summary.json"), JSON.stringify(summary, null, 2));

console.log(`PWA score: ${Math.round(pwaScore * 100)} (${pwaScore === 1 ? "pass" : "fail"})`);
if (failed.length > 0) {
  console.log("Failed audits:");
  for (const item of failed) {
    console.log(`  - ${item.id}: ${item.title} (${item.score})`);
  }
}

process.exit(pwaScore === 1 ? 0 : 1);
