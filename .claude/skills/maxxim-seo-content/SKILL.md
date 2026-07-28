---
name: maxxim-seo-content
description: "Generate GEO-oriented FAQ and service-page content for a client site — phrased the way people actually ask Google and AI assistants — grounded in the client's own strategy/brand so it's true to the business. Output lands as a DRAFT for partner approval, then is applied through the normal website skills. Use to deepen a site's on-page content for search + AI answers, e.g. 'write SEO FAQ content for [client]'."
metadata:
  phase: deploy
  output_file: memory/generated/deploy/seo-content.html
---

# SEO / GEO Content (SEO Layer 3)

Layer 1 gives a site the structured-facts foundation; this skill adds the **words**
that make it answer real questions — FAQ and service-page copy phrased as the
**conversational queries** people type into Google and ask assistants (the GEO lens:
*"how much does it cost to replace a hot water system in Cronulla?"*, not *"hot water services"*).

> **Draft-gated.** Everything you produce is a **draft** for the partner to review
> and approve before it goes near the live site (the platform rule — nothing
> publishes unreviewed). You write the content; the partner signs it off; then it's
> applied through the website skills.

## Step 1 — Ground it in the client (never generic)

Read the client's own material so the content is *true to this business*, not boilerplate:

- `memory/generated/discover/` + `memory/generated/design/` — **brand strategy**,
  **audience teardown**, **copy deck** (voice), and the **services/pricing** they offer.
- The website's `src/site.config.ts` — services, suburbs, NAP, hours.
- If a client **Brain** knowledge base exists, prefer answers grounded in it.

If you can't ground a claim (a price, a guarantee, a turnaround time), **leave a
`TODO` for the partner to fill** rather than inventing it — wrong specifics are worse
than a gap.

## Step 2 — Write for how people actually ask

Produce two kinds of content:

- **FAQ** — 8-15 questions in the customer's real words (cost, timing, "do you service
  my suburb?", warranty, emergencies, what to expect), each with a **direct, concise
  answer first** (the sentence an assistant can quote), then a fuller paragraph.
- **Service-page copy** — for each core service, a section that answers "what is it,
  when do I need it, what does it cost/involve, why this business" in plain language,
  weaving in the **service + suburb** naturally (never keyword-stuffed).

Keep the brand voice from the copy deck. Every answer should read like a helpful human,
because that's what both Google's helpful-content signals and AI assistants reward.

## Step 3 — Emit as a reviewable draft

Write to `memory/generated/deploy/seo-content.html` as a
[deliverable-format](../maxxim-deliverable-format/SKILL.md) document, clearly organised
by **page → section → question**, so the partner can review it as a unit. Register it
as a **draft** (via the proxy's draft flow / [maxxim-document](../maxxim-document/SKILL.md))
so it surfaces on the dashboard for sign-off, and **[maxxim-sync](../maxxim-sync/SKILL.md)**.

## Step 4 — Apply once approved

After the partner approves, apply the content through the site the normal way —
add/expand the FAQ + service sections via [maxxim-website-edit](../maxxim-website-edit/SKILL.md)
(unlocked sites) or [maxxim-web-build](../maxxim-web-build/SKILL.md) (locked Astro sites,
using the FAQ/prose section blocks). Add **FAQPage JSON-LD** for the FAQ (the starter
supports it) and redeploy — the build audit re-checks the Layer 1 standards.

## Quality bar

- Content is **grounded in the client's real strategy/services** — no invented prices,
  guarantees or claims (gaps left as partner `TODO`s).
- FAQ answers lead with a quotable one-liner (the GEO win) then expand.
- Service + suburb appear **naturally**, never stuffed.
- It ships as a **draft first**, never straight to the live site.
