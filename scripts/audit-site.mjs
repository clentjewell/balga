#!/usr/bin/env node
/**
 * Layer 1 SEO/GEO audit (Maxxim maxxim-seo-standards, adapted for the Balga repo).
 *
 * Checks the built `dist/` against the on-page checklist and exits non-zero on any
 * ERROR, so it can gate a deploy:  `node scripts/audit-site.mjs dist`
 *
 * Checklist: LocalBusiness + WebSite JSON-LD sitewide, sitemap.xml / robots.txt /
 * llms.txt present, per-page title + meta description + canonical + OG, exactly one
 * <h1>, every <img> has an alt attribute.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "node-html-parser";

const dist = process.argv[2] || "dist";
if (!existsSync(dist)) {
  console.error(`audit: dist directory not found: ${dist} (run \`npm run build\` first)`);
  process.exit(2);
}

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`ERROR  ${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`WARN   ${page}: ${msg}`);

// --- site-level files ---
for (const f of ["sitemap.xml", "robots.txt", "llms.txt"]) {
  if (!existsSync(join(dist, f))) err("(site)", `missing ${f}`);
}
if (!existsSync(join(dist, "llms-full.txt"))) warn("(site)", "missing llms-full.txt (GEO nice-to-have)");

// --- collect html pages ---
function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const pages = htmlFiles(dist);
if (!pages.length) err("(site)", "no HTML pages found in dist");

let sawLocalBusiness = false;
let sawWebSite = false;

for (const file of pages) {
  const rel = relative(dist, file);
  const is404 = /(^|\/)404\.html$/.test(rel);
  const html = readFileSync(file, "utf8");
  const root = parse(html, { comment: false });

  // JSON-LD blocks
  const ld = root.querySelectorAll('script[type="application/ld+json"]').map((s) => {
    try { return JSON.parse(s.text); } catch { err(rel, "invalid JSON-LD block"); return null; }
  }).filter(Boolean);
  const types = new Set();
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") {
      if (o["@type"]) [].concat(o["@type"]).forEach((t) => types.add(t));
      if (o["@graph"]) walk(o["@graph"]);
    }
  };
  ld.forEach(walk);
  if (types.has("LocalBusiness")) sawLocalBusiness = true;
  if (types.has("WebSite")) sawWebSite = true;
  if (!is404 && !types.has("LocalBusiness")) err(rel, "missing LocalBusiness JSON-LD");

  // head essentials
  const title = root.querySelector("title")?.text?.trim();
  if (!title) err(rel, "missing <title>");
  else if (title.length > 65) warn(rel, `title ${title.length} chars (>65 may truncate)`);

  const desc = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim();
  if (!is404) {
    if (!desc) err(rel, "missing meta description");
    else if (desc.length < 70 || desc.length > 165) warn(rel, `meta description ${desc.length} chars (aim 70–165)`);
  }
  if (!root.querySelector('link[rel="canonical"]')) err(rel, "missing canonical");
  if (!root.querySelector('meta[property="og:title"]')) err(rel, "missing og:title");
  if (!root.querySelector('meta[property="og:image"]')) err(rel, "missing og:image");

  // headings
  const h1s = root.querySelectorAll("h1");
  if (h1s.length === 0) err(rel, "no <h1>");
  else if (h1s.length > 1) err(rel, `${h1s.length} <h1> elements (must be exactly 1)`);

  // images alt
  for (const img of root.querySelectorAll("img")) {
    if (img.getAttribute("alt") === undefined) {
      err(rel, `<img> missing alt attribute (src=${(img.getAttribute("src") || "?").slice(0, 60)})`);
    }
  }
}

if (!sawLocalBusiness) err("(site)", "LocalBusiness JSON-LD not found on any page");
if (!sawWebSite) err("(site)", "WebSite JSON-LD not found on any page");

// --- report ---
console.log(`\nSEO/GEO Layer 1 audit — ${pages.length} pages in ${dist}\n`);
warnings.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));
console.log(
  `\n${errors.length ? "✗" : "✓"} ${errors.length} error(s), ${warnings.length} warning(s)\n`
);
process.exit(errors.length ? 1 : 0);
