import { defineConfig } from 'astro/config';
import { writeFileSync } from 'node:fs';

// Preview deployment URL (workers.dev). Override with SITE_URL when promoting
// to a production domain so canonicals/sitemap use the right origin.
const SITE = process.env.SITE_URL || 'https://balga-designs-preview.workers.dev';

/** Minimal sitemap generator (stable across Astro 4/5 via the `pages` API). */
function simpleSitemap() {
  return {
    name: 'simple-sitemap',
    hooks: {
      'astro:build:done': ({ pages, dir }) => {
        const base = SITE.replace(/\/$/, '');
        const urls = pages
          .map((p) => p.pathname)
          .filter((p) => !p.startsWith('404'))
          .map((p) => (p === '' ? '/' : '/' + p))
          .map((p) => (p.endsWith('/') ? p : p + '/'));
        const unique = [...new Set(urls)].sort();
        const body = unique
          .map((u) => `  <url><loc>${base}${u}</loc></url>`)
          .join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
        writeFileSync(new URL('sitemap.xml', dir), xml);
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [simpleSitemap()],
  compressHTML: true,
});
