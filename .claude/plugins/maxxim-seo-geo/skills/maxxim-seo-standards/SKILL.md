---
name: maxxim-seo-standards
description: "Reference — the on-page SEO/GEO standards every Maxxim-built site must ship (SEO Layer 1). LocalBusiness JSON-LD, per-service/per-suburb pages, sitemap/robots/llms.txt, meta/OG, semantic headings, alt text, one NAP source. maxxim-web-build enforces these and the audit blocks a build that's missing them. Read when building or reviewing a client site's SEO."
metadata:
  phase: deploy
  output_file: null
---

# SEO / GEO — Layer 1 standards (build-time)

Every Maxxim-built site ships these on-page standards so the business is legible
to **both Google and AI assistants** (ChatGPT, etc.). They're baked into the
website starter and **enforced by `scripts/audit-site.mjs`** — a build missing
any of them fails the audit and is blocked from promotion. Positioning to the
client: *"we make your business legible to both Google and ChatGPT"* — no snake
oil, just the structured-facts-and-reviews work that both reward.

## The one source of business facts

`src/site.config.ts` is the **single source of truth** for the business's
name/address/phone (NAP), services, service-area suburbs, hours and geo.
`maxxim-web-build` fills it from the client record. **Never hard-code NAP in a
page** — everything (schema, sitemap, llms.txt, footer) reads the config, so it
can never drift.

## The checklist (all automatic from the starter)

1. **LocalBusiness JSON-LD** — the single biggest win for a trade/service
   business. Emitted site-wide from `LocalBusinessSchema.astro` (name, address,
   phone, hours, area served, services). The audit fails if it's missing.
2. **Per-service pages** — `src/pages/services/[slug].astro` builds one page per
   service from the config, each with its own **Service** JSON-LD + internal
   links. **Per-suburb pages** are the same pattern (`/hot-water-cronulla`) — add
   them for the suburbs that genuinely matter, with **unique local copy** (never
   doorway-page stamp-outs — that's a Google penalty risk).
3. **sitemap.xml** (`src/pages/sitemap.xml.ts`) — every real route, from config.
4. **robots.txt** (`public/robots.txt`) — allows crawlers, points to the sitemap.
5. **llms.txt** (`src/pages/llms.txt.ts`) — a plain-text business summary AI
   assistants read. Cheap, early-mover for GEO.
6. **Meta + Open Graph** — title, description, canonical, OG/Twitter on every
   page (in `Base.astro`). Set a real `ogImage` (a brand share card).
7. **Semantic headings** — exactly one `<h1>`, no skipped levels.
8. **Alt text** — every `<img>` has descriptive alt (decorative → `alt=""` +
   `role="presentation"`).
9. **Core Web Vitals** — Astro static wins this; keep it (CDN images with
   dimensions, no render-blocking scripts).

## When building a site

- Fill `src/site.config.ts` from the client record FIRST (NAP, services, suburbs).
- Set `astro.config.mjs` `site` to the production hostname (canonical + sitemap
  need it), and `robots.txt` / the schema pick up the real URL.
- Run the build, then `node scripts/audit-site.mjs dist` — it must pass (fix any
  ERROR: missing schema, empty alt, missing sitemap/robots/llms, etc.).
- For an already-live site built before this, retrofit with the same files and
  redeploy (a `maxxim-seo-upgrade`-style pass).

## What this does NOT cover (later — SEO Layers 2 & 3)

Rank tracking (Google Search Console), Google Business Profile health, the
citations/backlinks playbook, and the review engine — those are the **recurring
audit** and **citations** layers, and need per-client Google authorization.
Report ranking **movement**, never guaranteed positions.
