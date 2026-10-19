/* Minimal build check — no deps. Run: node scripts/check.mjs
   Asserts: every local href/src in index.html exists, the redesign
   left no red hex behind, and the key assets are present. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "css/styles.css"), "utf8");
let fail = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : " FAIL ") + m); if (!c) fail++; };

// 1) local references resolve
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^https?:|^#|^mailto:|^tel:/.test(u));
for (const r of refs) ok(existsSync(resolve(root, r)), `asset exists: ${r}`);

// 2) required assets
for (const a of ["assets/hero.jpg", "assets/portrait.jpg", "assets/portrait.txt"])
  ok(existsSync(resolve(root, a)), `required: ${a}`);

// 3) no red hue survived the monochrome redesign
const reds = css.match(/#ff[0-9a-f]{4}|#c20014|ff2230|ff4a52/gi);
ok(!reds, `no red hex in CSS${reds ? " → " + [...new Set(reds)].join(", ") : ""}`);

// 4) fonts + libs wired
ok(/Fraunces/.test(html), "Fraunces loaded");
ok(/lenis@1\.1\.14/.test(html), "Lenis pinned");
ok(/gsap\/3\.12\.5/.test(html), "GSAP pinned");

console.log(fail ? `\n${fail} check(s) failed` : "\nAll checks passed ✓");
process.exit(fail ? 1 : 0);
