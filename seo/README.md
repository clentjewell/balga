# SEO / GEO — Maxxim skill layer

This folder holds the **document deliverables** produced by the Maxxim SEO/GEO
skill layer (installed in `.claude/skills/`). Layer 1 (on-page standards) is
applied directly in the site source and enforced by `scripts/audit-site.mjs`
(`npm run audit`); these documents are the strategy and Layer 3 work products.

## Deliverables (`seo/deliverables/`)

| File | Skill | What it is |
|---|---|---|
| `seo-strategy.html` | `maxxim-seo-strategy` | Full organic-search strategy — objectives, technical framework, keyword clusters, content model, on-page, local SEO, link building, competitor method, AI/GEO, measurement. |
| `citations-playbook.html` | `maxxim-citations-playbook` | Prioritised list of 26 citation targets (Google Business Profile first) with a canonical NAP block to paste, and a status checklist to work through by hand. |
| `seo-content.html` | `maxxim-seo-content` | **Draft** GEO content — 14 conversational FAQs + 6 service-page sections, phrased how people ask Google/AI. Review, then apply via the site's FAQ/prose sections. |

Each is pure semantic HTML5 (Maxxim deliverable-format) — open in a browser to
read. Prices/facts are grounded in the real business; unknowns are marked
`TODO: owner to confirm` rather than invented.

## Layer 1 (applied in source, not here)

LocalBusiness + WebSite JSON-LD (NAP from the single source `src/data/site.ts`,
with real `sameAs` profiles), Breadcrumb / FAQ / Service / Offer / BlogPosting /
VideoObject schema, sitemap.xml (+ XSL view), robots.txt, llms.txt / llms-full.txt,
per-page meta + OG + branded share image, one `<h1>`, alt text, LCP preload.
Run `npm run audit` after any build to re-check the whole checklist.
