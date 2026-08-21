# Balga Designs — Static Rebuild

A clean, coded static rebuild of [balgadesigns.com.au](https://balgadesigns.com.au/)
(originally WordPress + Elementor), reimplemented with **Astro** and deployed to
**Cloudflare Workers Static Assets**. The rebuild is visually faithful to the
live site but ships as maintainable, component-based code with no WordPress,
Elementor, jQuery or page-builder output.

> This is a preview clone. It is served with `noindex, nofollow` to avoid
> duplicate-content indexing (see [Disabling preview noindex](#disabling-preview-noindex)).

## Technology stack

- **[Astro](https://astro.build/)** (static output) + **TypeScript**
- Vanilla, scoped CSS with design tokens (CSS custom properties) — no UI framework
- Minimal, dependency-free client JavaScript for the interactive pieces
- Self-hosted **Montserrat** (variable woff2) — no third-party font requests
- **Cloudflare Workers Static Assets** + a small Worker for response headers and
  the `/api/contact` endpoint
- **Playwright** for route/interaction tests; **sharp** for image optimisation

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build & preview

```bash
npm run build      # -> dist/  (static site + sitemap.xml)
npm run preview    # serve the production build locally
```

## Testing & checks

```bash
npm run check      # astro check (TypeScript / template diagnostics)
npm run build      # production build must succeed
npm run test       # Playwright: 10 routes + 404, interactions, a11y, overflow, console errors
```

The Playwright suite covers every public route, the custom 404, the mobile menu,
before/after sliders (keyboard + pointer), FAQ accordion, contact-form
validation, and the video modal, at desktop (1440) and mobile (Pixel 7)
viewports. It verifies no broken images, no horizontal overflow and no console
errors.

## Deployment (Cloudflare Workers)

```bash
npx wrangler whoami          # confirm authentication
npm run build                # produce ./dist
npm run deploy               # wrangler deploy  ->  *.workers.dev
```

`wrangler.jsonc` serves `./dist` via Workers Static Assets with
`not_found_handling: "404-page"` (custom 404) and `run_worker_first: true` so the
Worker (`src/worker.js`) can add security headers, caching and the preview
`noindex` header, and handle `POST /api/contact`.

## Project structure

```
public/
  assets/          branding · icons · home · about · services · projects · pricing · blog · video
  fonts/           montserrat-var.woff2 (self-hosted)
  admin/           the Content Manager app (CMS UI)
  review/          content & local-search review pack (signed-in only)
  handoff/         client handoff document — what changed, SEO/GEO, updates requested
  sitemap.xsl      stylesheet for the human-readable sitemap view
  site.webmanifest
  (robots.txt, llms.txt & sitemap.xml are generated into dist/ at build time)
src/
  components/      Header, Footer, PageHero, Breadcrumbs, CTASection, ServiceCard,
                   BeforeAfterSlider, TestimonialSlider, FAQAccordion, VideoModal,
                   ContactForm, Counters, WhyChooseUs, HowWeWork, ProjectsPreview, Acknowledgement
  content/blog/    the three articles (Markdown content collection)
  data/            site, services, projects, pricing, testimonials, faqs, content
  layouts/         BaseLayout, ArticleLayout
  pages/           index, about, services, projects, pricing, balga-blog, contact, 404, [slug]
  styles/          tokens.css, global.css, components.css, utilities.css
  worker.js        Cloudflare Worker (headers + /api/contact)
audit/             design system, tokens, site map, content & asset inventories, improvements
_tools/            Node scripts used for the audit / asset pipeline
wrangler.jsonc     Workers Static Assets config
```

## Routes

| Route | Page |
|-------|------|
| `/` | Home |
| `/about/` | About |
| `/services/` | Services |
| `/projects/` | Projects (7 before/after sliders) |
| `/pricing/` | Pricing (4 packages) |
| `/balga-blog/` | Blog |
| `/contact/` | Contact |
| `/what-are-native-gardens/` | Article |
| `/why-designing-and-planning-are-crucial-for-successful-landscaping/` | Article |
| `/balga-meaning-purpose/` | Article |
| `*` | Custom 404 |

### Internal pages

Documents and tooling that ship with the site but are not part of the public
website. They carry `noindex, nofollow` (meta tag *and* `X-Robots-Tag`), never
appear in `sitemap.xml`, `llms.txt` or `llms-full.txt`, and are skipped by the
Layer 1 SEO audit.

| Route | Page | Access |
|-------|------|--------|
| `/admin/` | Content Manager (CMS UI) | Sign-in required |
| `/review/` | Content & local-search review pack | Signed-in only — served as 404 otherwise |
| `/handoff/` | Client handoff document — what changed, the SEO/GEO work, every update requested from the 29 Jul – 20 Aug 2026 email thread, and the remaining go-live steps | Link-shareable (noindex) |

`/handoff/` is deliberately reachable without a login so it can be emailed to the
client, the way `/review/` could not be. It carries no credentials. To put it
behind the CMS session instead, add `/handoff` to the gated-path check in
`src/worker.js`.

## Asset policy

All imagery is the client's own, downloaded from the live site, de-duplicated,
organised under `public/assets/**`, and re-encoded (quality ≥ 82, transparency
preserved) — **no** AI images, stock replacements, substitutes or hotlinking to
WordPress. Every file traces back to its original source URL in
`audit/asset-inventory.json`; intrinsic dimensions are recorded in
`audit/asset-dimensions.json` and used for `width`/`height` attributes to prevent
layout shift.

## Contact-form environment variables

`POST /api/contact` validates server-side and, if delivery credentials are
present, sends email via [Resend](https://resend.com/). Without credentials it
returns an honest **preview-mode** message (it never fakes a successful send).
Configure as Wrangler secrets (never commit them):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Recipient inbox (e.g. `info@balgadesigns.com.au`) |
| `CONTACT_FROM_EMAIL` | Verified sender address |

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
```

See `.env.example`. Local dev secrets can go in `.dev.vars` (git-ignored).

## Cloudflare configuration

- **Static assets:** `./dist`, binding `ASSETS`, `html_handling: auto-trailing-slash`.
- **Custom 404:** `not_found_handling: "404-page"` serves `dist/404.html` with a 404 status.
- **Worker (`run_worker_first: true`)** adds on every response:
  - security headers (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`),
  - long-lived immutable caching for `/_astro/*` and `/fonts/*`, medium caching for `/assets/*`, revalidated HTML,
  - `X-Robots-Tag: noindex, nofollow` on the preview.

## Disabling preview noindex

The site is live at **https://balgadesigns.com.au** and indexable by default — no
build flags needed. Three switches control this, all defaulting to "live":

| Switch | Where | Default | Controls |
| --- | --- | --- | --- |
| `SITE_URL` | build-time env | `https://balgadesigns.com.au` | canonicals, sitemap, `og:url`, `llms.txt` |
| `PUBLIC_NOINDEX` | build-time env | unset (= indexable) | `<meta name="robots">` and `robots.txt` |
| `PREVIEW_NOINDEX` | Worker var in `wrangler.jsonc` | `"false"` | the `X-Robots-Tag` response header |

To stand up a **preview or staging clone** that must stay out of search results,
flip all three together — half-measures leak (a `robots.txt` that allows crawling
on a clone whose canonicals point at the live site is worse than either alone):

```bash
SITE_URL=https://your-preview.workers.dev PUBLIC_NOINDEX=true npm run build
# …and set "PREVIEW_NOINDEX": "true" in that deployment's wrangler vars.
```

## SEO & structured data

- **Meta** — per-page SEO titles + descriptions, canonical, Open Graph / Twitter
  cards (`en_AU`) with a branded 1200×630 share image
  (`assets/branding/og-image.jpg`), geo tags, `theme-color`, a web app manifest,
  and a preloaded LCP hero image per page (`fetchpriority=high`) for Core Web Vitals.
- **Structured data (JSON-LD)** — `LocalBusiness` + `WebSite` sitewide,
  `BreadcrumbList` on inner pages, `FAQPage` on Pricing/Projects,
  `BlogPosting` (with `wordCount`/`dateModified`) on articles, `VideoObject` on
  pages with the intro video, and priced `Service`/`OfferCatalog` on
  Services & Pricing.
- **Sitemap** — `/sitemap.xml` (with `<lastmod>`), styled by `/sitemap.xsl` into a
  Yoast/RankMath-style human-readable view when opened in a browser. Generated at
  build time from Astro's `pages` API.
- **robots.txt**, **llms.txt** and **llms-full.txt**
  ([llmstxt.org](https://llmstxt.org)) are generated at build time and point at
  the current origin. `llms.txt` gives AI answer engines a clean, linked overview;
  `llms-full.txt` carries the full extractable page copy (GEO).

## Attribution

Design, content and imagery © Balga Designs. Original site developed by Jewell
Projects. This repository is a coded static rebuild for preview purposes.
