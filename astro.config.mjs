import { defineConfig } from 'astro/config';
import { writeFileSync, readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';

// Preview deployment URL (workers.dev). Override with SITE_URL when promoting
// to a production domain so canonicals/sitemap use the right origin.
const SITE = process.env.SITE_URL || 'https://balga-designs-preview.clent.workers.dev';
// Production build (allow indexing) is signalled the same way the pages are:
// PUBLIC_NOINDEX=false. Anything else keeps the deployment private (preview).
const INDEXABLE = process.env.PUBLIC_NOINDEX === 'false';

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
      'astro:build:done': ({ pages, dir }) => {
        const urls = toUrls(pages);
        const lastmod = new Date().toISOString().slice(0, 10);

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
            `# Production build (PUBLIC_NOINDEX=false) emits an allow rule automatically.\n` +
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
        const corePages = ['/', '/about/', '/services/', '/projects/', '/pricing/', '/faqs/', '/contact/'];
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
- Email: info@balgadesigns.com.au
- Phone: 041 373 1670 (+61 413 731 670)
- Location: Lennox Head, NSW 2478, Australia
- Service area: Northern Rivers (NSW) to Southern Gold Coast (QLD)
- Hours: Monday–Friday, 07:00–16:00 AEST
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
> Contact: info@balgadesigns.com.au · 041 373 1670

${sections.join('\n---\n\n')}`;
        writeFileSync(new URL('llms-full.txt', dir), llmsFull);
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
