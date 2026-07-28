---
name: maxxim-citations-playbook
description: "Generate a client-specific CITATIONS playbook — a prioritised list of where to list the business (Google Business Profile first, local directories, industry associations, supplier 'find an installer' pages, local sponsorships) with ready-to-paste submission content using the client's exact NAP. Execution stays human: the output is a tracked checklist the partner works through. Use for local-SEO/GEO citation building, e.g. 'make a citations playbook for [client]'."
metadata:
  phase: deploy
  output_file: memory/generated/deploy/citations-playbook.html
---

# Citations Playbook (SEO Layer 3)

Consistent **citations** — the same business Name, Address, Phone (NAP) listed
across the web — are the durable local-SEO/GEO play for a trade/service business
(no link schemes, no snake oil). This skill produces a **prioritised, client-specific
target list with ready-to-submit content**. **Execution stays human** — the partner
(or the client) submits each listing and ticks it off.

## Step 1 — Load the one true NAP

NAP has **exactly one source**: the client's website `src/site.config.ts` (the same
file the LocalBusiness JSON-LD, sitemap and `llms.txt` read — see
[maxxim-seo-standards](../maxxim-seo-standards/SKILL.md)). Read it for the canonical
**name, address, phone, hours, website, services, service-area suburbs, geo**.

- If there's no site yet, fall back to the client record (ask via the proxy / the
  onboarding brief). **Never invent or vary the NAP** — inconsistent NAP across
  citations is the exact thing that *hurts* local ranking.

## Step 2 — Build the target list (prioritised)

Produce a list tailored to *this* business's trade + location, in priority order:

1. **Google Business Profile** — always first; the single highest-impact citation.
2. **Core aggregators / directories** — the ones that matter in the client's country
   (e.g. AU: True Local, Yellow Pages, Yelp, Hotfrog, StartLocal; local council/chamber directories).
3. **Industry associations & trade bodies** — the ones for the client's trade
   (e.g. Master Plumbers, Master Builders, NECA) — often the highest-trust citations.
4. **Supplier "find an installer/stockist" listings** — the brands the client fits/installs
   (e.g. a hot-water or solar brand's dealer locator). High intent, low competition.
5. **Local sponsorships / community** — sports clubs, schools, local events the business
   already supports (a real backlink + citation, not a scheme).

For each target capture: **name, URL, why it matters, cost (free/paid), and priority (High/Med/Low)**.

## Step 3 — Write the submission content (paste-ready)

Once, at the top, produce the **canonical listing block** every submission reuses —
NAP verbatim from Step 1, plus a **short (≈50-word) and long (≈150-word) business
description**, primary + secondary **categories**, and the **services/suburbs** list.
Ground the description's voice in the client's brand (read
`memory/generated/design/copy-deck.html` / `brand-strategy.html` if present) so it
sounds like them. Consistency is the point — every directory gets the *same* facts.

## Step 4 — Emit the tracked checklist

Write the playbook to `memory/generated/deploy/citations-playbook.html` as a
[deliverable-format](../maxxim-deliverable-format/SKILL.md) document:

- The **canonical listing block** at the top (copy-paste source of truth).
- A **table**: Target · Priority · Cost · URL · Status (a checkbox column the partner
  ticks — Not started / Submitted / Live) · Notes (login, listing URL once live).
- A short "how to work this" intro: do them top-down, keep NAP identical everywhere,
  record the live URL for each so you can re-verify later.

Register it in the client's **Documents** with
[maxxim-document](../maxxim-document/SKILL.md) (template `citations-playbook`) so it's
visible on the dashboard, then **[maxxim-sync](../maxxim-sync/SKILL.md)** the workspace.

## Quality bar

- Every target is real, relevant to the client's **trade + location**, and prioritised.
- NAP is **identical** to `site.config.ts` everywhere it appears — no variants.
- The partner can literally copy a block and paste it into each directory.
- It's a **checklist to work through by hand**, not an automated submitter (automated
  citation submission is out of scope by design — it gets accounts banned).
