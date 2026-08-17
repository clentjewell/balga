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
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
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

/** Every <a href> on the site, collected below and checked after the page loop. */
const links = [];

let sawLocalBusiness = false;
let sawWebSite = false;

for (const file of pages) {
  const rel = relative(dist, file);
  // Utility pages that aren't part of the public website (skip site-page checks).
  if (/^(review|admin)\//.test(rel)) continue;
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

  // links (checked after the loop, reported to the CMS dashboard)
  for (const a of root.querySelectorAll("a[href]")) {
    const href = (a.getAttribute("href") || "").trim();
    if (href) links.push({ page: "/" + rel.replace(/index\.html$/, ""), href, text: a.text.trim().slice(0, 80) });
  }
}

if (!sawLocalBusiness) err("(site)", "LocalBusiness JSON-LD not found on any page");
if (!sawWebSite) err("(site)", "WebSite JSON-LD not found on any page");

// --- link check (feeds the CMS dashboard's "Broken links" card) ---------------
// Internal links are resolved against the built files; external links get a HEAD
// (falling back to GET). Findings are warnings, never build errors: a dead outbound
// link should never stop the client publishing a change.

const SKIP_EXTERNAL = process.env.AUDIT_SKIP_EXTERNAL === "1";
const internalBroken = [];
const externalBroken = [];
const unreachable = [];
const blocked = [];
// Sites that fend off automated checks (rate limits, bot walls) answer with these.
// They mean "we won't talk to a robot", not "this link is dead" — reporting them as
// broken would train the client to ignore the card.
const BOT_WALL = new Set([401, 403, 429, 999]);

/** Does a site-absolute path exist in the build? */
function existsInDist(pathname) {
  const clean = decodeURI(pathname).replace(/^\//, "");
  if (clean === "") return true; // "/" → index.html
  const candidates = [join(dist, clean), join(dist, clean, "index.html"), join(dist, clean + "index.html")];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile()) || existsSync(join(dist, clean));
}

// Pages the client unpublished from the dashboard (written by the build). Links to
// these aren't typos — they're a consequence of unpublishing, and the fix is either
// to publish the page again or to edit the link, so they're reported separately.
let draftPaths = [];
try {
  draftPaths = JSON.parse(readFileSync(join(dist, "_cms", "page-status.json"), "utf8")).draftPaths || [];
} catch { /* no status file — treat everything as published */ }
const toUnpublished = [];

const externalUrls = new Map(); // url -> [{page, text}]
for (const l of links) {
  const href = l.href;
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
  if (/^https?:\/\//i.test(href)) {
    if (!externalUrls.has(href)) externalUrls.set(href, []);
    externalUrls.get(href).push(l);
    continue;
  }
  if (!href.startsWith("/")) continue; // relative links aren't used in this build
  const pathname = href.split(/[?#]/)[0];
  if (draftPaths.includes(pathname)) toUnpublished.push({ page: l.page, href, text: l.text });
  else if (!existsInDist(pathname)) internalBroken.push({ page: l.page, href, text: l.text });
}

async function check(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ac.signal });
    // Some servers reject HEAD outright — confirm with a GET before calling it broken.
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ac.signal });
    }
    return { status: res.status };
  } catch (e) {
    return { error: e.name === "AbortError" ? "timeout" : String(e.message || e).slice(0, 80) };
  } finally {
    clearTimeout(timer);
  }
}

if (!SKIP_EXTERNAL && externalUrls.size) {
  const entries = [...externalUrls.entries()];
  const CONCURRENCY = 6;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
      while (cursor < entries.length) {
        const [url, sources] = entries[cursor++];
        const r = await check(url);
        const on = sources.map((s) => s.page);
        if (r.error) unreachable.push({ url, reason: r.error, pages: on });
        else if (BOT_WALL.has(r.status)) blocked.push({ url, status: r.status, pages: on });
        else if (r.status >= 400) externalBroken.push({ url, status: r.status, pages: on });
      }
    })
  );
}

internalBroken.forEach((b) => warn(b.page, `broken internal link → ${b.href}`));
toUnpublished.forEach((b) => warn(b.page, `links to the unpublished page ${b.href}`));
externalBroken.forEach((b) => warn(b.pages[0], `broken external link (${b.status}) → ${b.url}`));

// The dashboard reads this at /_cms/link-report.json.
const report = {
  generatedAt: new Date().toISOString(),
  checkedPages: pages.length,
  checkedLinks: links.length,
  externalChecked: SKIP_EXTERNAL ? 0 : externalUrls.size,
  externalSkipped: SKIP_EXTERNAL,
  internalBroken,
  toUnpublished,
  externalBroken,
  unreachable,
  blocked,
};
mkdirSync(join(dist, "_cms"), { recursive: true });
writeFileSync(join(dist, "_cms", "link-report.json"), JSON.stringify(report, null, 2) + "\n");

// --- report ---
console.log(`\nSEO/GEO Layer 1 audit — ${pages.length} pages in ${dist}\n`);
console.log(
  `links: ${links.length} checked · ${internalBroken.length} broken internal · ` +
  `${toUnpublished.length} to unpublished pages · ` +
  `${externalBroken.length} broken external · ${unreachable.length} unreachable · ${blocked.length} bot-walled` +
  (SKIP_EXTERNAL ? " (external checks skipped)" : "")
);
warnings.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));
console.log(
  `\n${errors.length ? "✗" : "✓"} ${errors.length} error(s), ${warnings.length} warning(s)\n`
);
process.exit(errors.length ? 1 : 0);
