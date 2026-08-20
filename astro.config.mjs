import { defineConfig } from 'astro/config';
import { writeFileSync, readFileSync, rmSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'node-html-parser';
import sharp from 'sharp';
import { draftPaths } from './src/data/pages.mjs';
// The one source of business facts (NAP) — edited by the client in the CMS.
// llms.txt reads it from here so it can never drift from the rest of the site.
import settings from './src/data/content/settings.json';

// The live origin — canonicals, the sitemap, og:url and llms.txt are all built
// from it. A preview or staging clone points somewhere else with SITE_URL so it
// can't claim to be the real site.
const SITE = process.env.SITE_URL || 'https://balgadesigns.com.au';
// The live site is meant to be found. A preview clone hides itself the same way
// the pages do: build with PUBLIC_NOINDEX=true.
const INDEXABLE = (process.env.PUBLIC_NOINDEX ?? 'false') !== 'true';

const BASE = SITE.replace(/\/$/, '');
const HOST = BASE.replace(/^https?:\/\//, '');

// Friendly labels + descriptions for the human-readable sitemap and llms.txt.
const PAGE_META = {
  '/': ['Home', 'Native & sustainable garden design across the Northern Rivers to the Southern Gold Coast.'],
  '/about/': ['About', 'Regenerative native-garden designers rooted in Country and local ecology.'],
  '/services/': ['Services', 'Landscape design, garden facelifts, planting, pest & weed management and horticulture advice.'],
  '/projects/': ['Projects', 'Before-and-after native garden transformations across the Northern Rivers.'],
  '/pricing/': ['Pricing', 'Four transparent garden design packages, from Small NativeScapes to the Complete Design Package.'],
  '/faqs/': ['FAQs', 'Answers on cost, packages, timing, service areas, sustainability and payment. First consultation is free.'],
  '/balga-blog/': ['Blog', 'Stories and guides on native gardens and sustainable landscape design.'],
  '/contact/': ['Contact', 'Book a free consultation for sustainable native garden design.'],
  '/services/landscape-design/': ['Landscape Design', 'Custom native landscape design; packages from $2,500 to $4,500.'],
  '/services/garden-facelift/': ['Garden Facelift', 'A sustainable refresh of an existing garden; free consultation and tailored quote.'],
  '/services/decorative-plants/': ['Decorative Plants & Pot Styling', 'Potted greenery styling for indoor and outdoor spaces; $2,000 package.'],
  '/services/integrated-pest-management/': ['Integrated Pest Management', 'Chemical-free, ecological pest management that restores biodiversity.'],
  '/services/weed-control/': ['Weed Control Consultation', 'Sustainable, low-harm advice to manage and prevent weeds.'],
  '/services/horticulture-consultation/': ['Horticulture Consultation', 'Expert plant selection, soil health and sustainable gardening advice.'],
  '/what-are-native-gardens/': ['What are Native Gardens?', 'A guide to naturalistic native gardens and the benefits of native landscaping.'],
  '/why-designing-and-planning-are-crucial-for-successful-landscaping/': ['Why Designing & Planning Matter', 'How thoughtful landscape design and planning save money, time and frustration.'],
  '/balga-meaning-purpose/': ['Balga Meaning & Purpose', 'The meaning behind the name Balga and our Country-rooted design philosophy.'],
};

/**
 * Give every <img> its intrinsic width/height.
 *
 * Markdown images and a couple of components emit <img> with no dimensions, which
 * costs layout shift (CLS) on load. Rather than hand-annotating each one — and
 * re-doing it whenever the client swaps an image in the CMS — the build reads the
 * real file and writes the attributes in. Global CSS keeps `height: auto`, so the
 * attributes only supply the aspect ratio.
 */
async function addImageDimensions(dir) {
  const root = fileURLToPath(dir);
  const sizes = new Map(); // src -> "width height" | null
  let touched = 0;

  const files = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) { if (name !== 'admin' && name !== '_cms') walk(p); }
      else if (name.endsWith('.html')) files.push(p);
    }
  };
  walk(root);

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    let out = html;
    for (const tag of tags) {
      if (/\bwidth=/.test(tag) && /\bheight=/.test(tag)) continue;
      const src = (tag.match(/\bsrc="([^"]+)"/) || [])[1];
      if (!src || !src.startsWith('/') || /\.svg(\?|$)/i.test(src)) continue;
      if (!sizes.has(src)) {
        try {
          const meta = await sharp(join(root, decodeURI(src.split(/[?#]/)[0]))).metadata();
          sizes.set(src, meta.width && meta.height ? `${meta.width} ${meta.height}` : null);
        } catch { sizes.set(src, null); }
      }
      const dims = sizes.get(src);
      if (!dims) continue;
      const [w, h] = dims.split(' ');
      out = out.replace(tag, tag.replace(/(\s*\/?>)$/, ` width="${w}" height="${h}"$1`));
      touched++;
    }
    if (out !== html) writeFileSync(file, out);
  }
  return touched;
}

/**
 * Hash every inline <script> so the Content-Security-Policy can name them
 * instead of allowing 'unsafe-inline'.
 *
 * Inline blocks are unavoidable here — Astro's hoisted scripts and the JSON-LD
 * the SEO work depends on are both inline — but a hash lets the browser run
 * exactly those and nothing else, so an injected <script> is refused. The Worker
 * reads this manifest and emits a per-page policy (see src/worker.js).
 */
function writeCspManifest(dir) {
  const root = fileURLToPath(dir);
  const manifest = {};

  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) { if (name !== '_cms') walk(p); continue; }
      if (!name.endsWith('.html')) continue;

      const html = readFileSync(p, 'utf8');
      const hashes = [];
      for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\ssrc=/.test(m[1])) continue; // external file — covered by 'self'
        hashes.push('sha256-' + createHash('sha256').update(m[2], 'utf8').digest('base64'));
      }

      // dist/about/index.html -> /about/ ; dist/index.html -> / ; dist/404.html -> /404.html
      let route = '/' + relative(root, p).split(sep).join('/');
      route = route.endsWith('/index.html') ? route.slice(0, -'index.html'.length) : route;
      manifest[route] = [...new Set(hashes)];
    }
  };
  walk(root);

  mkdirSync(new URL('_cms/', dir), { recursive: true });
  writeFileSync(new URL('_cms/csp.json', dir), JSON.stringify(manifest, null, 2) + '\n');
  return Object.values(manifest).reduce((n, h) => n + h.length, 0);
}

function toUrls(pages) {
  return [...new Set(
    pages
      .map((p) => p.pathname)
      .filter((p) => !p.startsWith('404'))
      .map((p) => (p === '' ? '/' : '/' + p))
      .map((p) => (p.endsWith('/') ? p : p + '/'))
  )].sort();
}

/** XML sitemap + XSL-styled human view + robots.txt + llms.txt (Astro 4/5 safe). */
function seoFiles() {
  return {
    name: 'balga-seo-files',
    hooks: {
      'astro:build:done': async ({ pages, dir }) => {
        // Pages the client has unpublished from the CMS dashboard: delete the built
        // HTML so the URL falls through to the 404 page, and keep them out of the
        // sitemap / llms files below.
        for (const p of draftPaths) {
          rmSync(new URL(p.replace(/^\//, ''), dir), { recursive: true, force: true });
        }
        const urls = toUrls(pages).filter((u) => !draftPaths.includes(u));
        const lastmod = new Date().toISOString().slice(0, 10);

        // Session-gated by the Worker (see src/worker.js): the audit reads this to
        // tell "link to a page you unpublished" apart from "link to nowhere", and
        // the CMS dashboard reads the link report written alongside it.
        mkdirSync(new URL('_cms/', dir), { recursive: true });
        writeFileSync(new URL('_cms/page-status.json', dir), JSON.stringify({ draftPaths }, null, 2) + '\n');

        // --- sitemap.xml (with stylesheet reference for the Yoast/RankMath-style view) ---
        const body = urls
          .map((u) => `  <url>\n    <loc>${BASE}${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
          .join('\n');
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
        writeFileSync(new URL('sitemap.xml', dir), xml);

        // --- robots.txt (environment-aware) ---
        let robots;
        if (INDEXABLE) {
          const aiBots = [
            'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
            'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended',
            'Applebot-Extended', 'CCBot', 'Bingbot', 'DuckDuckBot',
          ];
          robots =
            `# Balga Designs — ${BASE}\n` +
            `User-agent: *\n` +
            `Allow: /\n\n` +
            `# Reputable search & answer-engine (AI) crawlers are welcome.\n` +
            aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n') +
            `\n\nSitemap: ${BASE}/sitemap.xml\n` +
            `Host: ${HOST}\n`;
        } else {
          robots =
            `# Balga Designs — preview deployment. Indexing is disabled for this clone.\n` +
            `# Building without PUBLIC_NOINDEX=true emits the production allow rules.\n` +
            `User-agent: *\n` +
            `Disallow: /\n\n` +
            `Sitemap: ${BASE}/sitemap.xml\n`;
        }
        writeFileSync(new URL('robots.txt', dir), robots);

        // --- llms.txt (llmstxt.org — helps GEO / AI answer engines) ---
        const link = (u) => {
          const [label, desc] = PAGE_META[u] || [u, ''];
          return `- [${label}](${BASE}${u})${desc ? `: ${desc}` : ''}`;
        };
        const corePages = ['/', '/about/', '/services/', '/projects/', '/pricing/', '/faqs/', '/contact/']
          .filter((u) => urls.includes(u));
        const servicePages = urls.filter((u) => u.startsWith('/services/') && u !== '/services/');
        const articles = urls.filter((u) => u.startsWith('/what-') || u.startsWith('/why-') || u.startsWith('/balga-meaning'));
        const llms =
`# Balga Designs

> Balga Designs is a sustainable landscape and native garden design studio based in Lennox Head, NSW, serving the Northern Rivers region through to the Southern Gold Coast. We create beautiful, regenerative, low-maintenance native gardens that work with the local landscape and support ecosystems.

Balga Designs blends aesthetic appeal with ecological responsibility. Services span full landscape design, garden facelifts, decorative and potted planting, integrated pest management, weed control and horticulture consultation. Four fixed-scope design packages make professional design accessible for smaller projects and new builds alike.

## Key pages
${corePages.map(link).join('\n')}
- [Blog](${BASE}/balga-blog/): Guides and stories on native gardens and sustainable design.

## Services
${servicePages.map(link).join('\n')}

## Articles
${articles.map(link).join('\n')}

## Contact
- Email: ${settings.email}
- Phone: ${settings.phone}
- Location: ${settings.address}
- Service area: ${settings.serviceArea}
- Hours: ${settings.hours}
`;
        writeFileSync(new URL('llms.txt', dir), llms);

        // --- llms-full.txt (full extractable page copy for AI answer engines) ---
        const sections = urls.map((u) => {
          const rel = u === '/' ? 'index.html' : u.slice(1) + 'index.html';
          let text = '';
          let heading = (PAGE_META[u] && PAGE_META[u][0]) || u;
          try {
            const root = parse(readFileSync(new URL(rel, dir), 'utf8'));
            const h1 = root.querySelector('h1');
            if (h1) heading = h1.text.trim();
            const main = root.querySelector('#main') || root.querySelector('main') || root;
            main.querySelectorAll('script, style, noscript, svg').forEach((n) => n.remove());
            text = main.structuredText
              .replace(/[ \t]+\n/g, '\n')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
          } catch { /* skip unreadable page */ }
          return `## ${heading}\nURL: ${BASE}${u}\n\n${text}\n`;
        });
        const llmsFull =
`# Balga Designs — full content

> Extractable text content of balgadesigns.com.au for AI answer engines and LLMs.
> Sustainable landscape & native garden design, Lennox Head NSW, serving the Northern Rivers to the Southern Gold Coast.
> Contact: ${settings.email} · ${settings.phone}

${sections.join('\n---\n\n')}`;
        writeFileSync(new URL('llms-full.txt', dir), llmsFull);

        const withDims = await addImageDimensions(dir);
        if (withDims) console.log(`balga-seo-files: added width/height to ${withDims} image(s)`);

        // Must run last: it hashes the HTML exactly as it will be served.
        const hashed = writeCspManifest(dir);
        console.log(`balga-seo-files: hashed ${hashed} inline script(s) for the CSP`);
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [seoFiles()],
  compressHTML: true,
});
