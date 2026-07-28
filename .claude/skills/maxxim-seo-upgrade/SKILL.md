---
name: maxxim-seo-upgrade
description: "Retrofit SEO Layer 1 onto a client site that was built (or imported) BEFORE the standards existed. Audits the live site + its workspace source against the checklist, patches the source (NAP config, JSON-LD, sitemap/robots/llms.txt, per-service pages, meta/alt), then hands off to the normal build → deploy flow. Use to bring an older/imported site up to standard, e.g. 'run an SEO upgrade on [client]'s site'."
metadata:
  phase: deploy
  output_file: null
---

# SEO Upgrade — retrofit Layer 1 (SEO-13)

New Maxxim builds ship search-ready by default (the audit **fails the build** if not —
see [maxxim-seo-standards](../maxxim-seo-standards/SKILL.md)). Older sites — built before
the standard, or **imported** from a client's existing site — predate that gate. This
skill brings them up to standard: **audit → patch the source → rebuild → redeploy**.

## Step 0 — Check the lock state first

Only run on a **locked** (Astro) site that Maxxim builds from source. If the site is
**unlocked** (dashboard-managed static HTML under `site/`), the on-page standards are
edited there instead — see [maxxim-website-edit](../maxxim-website-edit/SKILL.md). Don't
scaffold/build an unlocked site.

## Step 1 — Locate the workspace source

Find the client's `website/` project in their workspace. If it isn't there but the site
is live, pull the source first (or [import it](../maxxim-web-build/SKILL.md)) — you patch
**source**, never the deployed output.

## Step 2 — Audit against the checklist

Build the site and run the static audit — it's the checklist made executable:

```bash
cd website && npm install && npm run build && npm run audit
```

The audit reports exactly what's missing: LocalBusiness JSON-LD, `sitemap.xml`,
`robots.txt`, `llms.txt`, per-service pages, meta/OG, `<h1>`/heading hierarchy, image
alt text. Also **read the live site** (fetch a page or two) to catch anything the source
audit can't see (e.g. a hardcoded NAP that drifts from the record).

## Step 3 — Patch the source (the diff)

Fix every gap **in source**, reusing the starter's mechanisms — do **not** hand-roll:

1. **Fill `src/site.config.ts`** from the client record — NAP, services, suburbs, hours,
   geo. This is the single source that feeds the schema, sitemap, `llms.txt` and footer,
   so filling it fixes most of the checklist at once. **Remove any hardcoded NAP** from
   page copy (a build-check failure by SEO-10).
2. **Add the missing generated routes/components** if the site predates them
   (`LocalBusinessSchema.astro` in the layout head, `sitemap.xml.ts`, `llms.txt.ts`,
   `public/robots.txt`, `services/[slug].astro`) — copy them from the current starter.
3. **Meta/OG, headings, alt text** — set title/description/canonical/OG per page, one
   `<h1>`, and descriptive `alt` on every image.

## Step 4 — Re-audit, then hand off to deploy

Rebuild and re-run `npm run audit` until it **passes with zero errors**. Then hand off to
the normal flow — [maxxim-web-deploy](../maxxim-web-deploy/SKILL.md) to a **preview**,
[maxxim-web-review](../maxxim-web-review/SKILL.md), then promote. Redeploying re-runs the
same validation, so a passing deploy *is* the proof the retrofit worked.
**[maxxim-sync](../maxxim-sync/SKILL.md)** the patched source.

## Quality bar

- The site's `npm run audit` **passes with zero errors** after the patch (same gate as a
  fresh build).
- NAP comes only from `site.config.ts` — no hardcoded copies remain.
- You patched **source and redeployed** — never edited the live output directly.
- On the client-zero / dogfood site first before running against real client sites.
