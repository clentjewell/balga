---
name: maxxim-seo-strategy
description: "Generate the SEO Strategy document for the Design phase. Produces a comprehensive organic search plan covering technical foundations, keyword targeting, content strategy, link building, and measurement."
metadata:
  phase: design
  output_file: seo-strategy.html
---

# SEO Strategy

## What this skill produces

A structured SEO strategy document that translates business goals into an actionable organic search plan. Covers technical foundations, keyword clusters, content architecture, link building, and measurement — with realistic timelines and competitor benchmarking.

## Output format

Write this deliverable as a complete **semantic HTML5** document following the [deliverable-format](../maxxim-deliverable-format/SKILL.md) skill — saved to `memory/generated/design/seo-strategy.html`.

---

## Output structure

Fill these sections:

### 1. SEO Objectives

Organic traffic targets, keyword ranking goals, domain authority goals, and timeline. Set specific, measurable milestones at 3, 6, and 12 months. Tie objectives to business KPIs from the marketing plan.

### 2. Technical SEO Audit Framework

Define what to check and fix across: site structure and URL architecture, crawlability and indexation (robots.txt, XML sitemaps, canonical tags), page speed and Core Web Vitals (LCP, FID/INP, CLS), mobile-friendliness, schema markup opportunities, HTTPS and security, and redirect chains. Prioritise issues by impact.

### 3. Keyword Strategy

Primary keyword clusters organised by topic, with search volume estimates and keyword difficulty ratings for each. Classify every keyword by search intent (informational, navigational, commercial, transactional). Include a keyword-to-page mapping table that assigns each target keyword to a specific existing or planned page.

### 4. Content Strategy for SEO

Content gap analysis approach based on competitor coverage. Define the pillar/cluster content model — hub pages and supporting content. Blog or resource centre strategy with topic priorities and publishing cadence. Include content brief requirements for each target keyword cluster.

### 5. On-Page Optimisation

Title tag and meta description formulas (with examples). Heading structure (H1–H3) guidelines. Internal linking strategy with link equity distribution approach. Image optimisation (alt text, compression, format). URL structure conventions.

### 6. Local SEO

If applicable to the business: Google Business Profile optimisation checklist, local citation sources, review generation and management strategy, and locally-targeted content. If not applicable, state why and skip.

### 7. Link Building Strategy

Target domain types and examples. Outreach approach per domain tier. Content-led link building tactics (linkable assets, data studies, tools). Digital PR angles that align with the PR plan. Toxic link identification and disavow approach if needed.

### 8. Competitor SEO Analysis

Analyse the top 3 organic competitors: domain authority comparison, top-ranking keywords they hold that the client doesn't, content themes driving their organic traffic, backlink profile comparison (volume, quality, referring domain diversity), and specific gaps the client can exploit.

### 9. AI Search & SGE Considerations

How AI overviews and zero-click searches affect the client's target keywords. Content format adaptations to earn featured snippets and AI citations (structured data, concise answers, authoritative sourcing). Opportunities where AI search may reduce or redirect traffic, and mitigations.

### 10. Measurement & Reporting

Tools required (e.g., Google Search Console, GA4, rank tracking). KPIs: organic sessions, keyword rankings, click-through rate, backlinks acquired, Core Web Vitals scores. Reporting cadence (monthly recommended). Milestone checkpoints at 3, 6, and 12 months with expected outcomes at each.

---

## Inputs

Use the Discovery Dataset plus CP1 and CP2 outputs:

- Discovery Dataset (business context, goals, competitive landscape)
- CP1: competitor-analysis.html, customer-profile.html
- CP2: website-strategy.html, marketing-plan.html, copy-deck.html
- Any existing SEO audits, analytics data, or Search Console exports

## Quality bar

- Every keyword recommendation must include search intent classification and difficulty estimate.
- Technical recommendations must be prioritised by impact, not listed as a flat checklist.
- Competitor analysis must identify specific, exploitable gaps — not just "they rank well."
- Timelines must be realistic: no promises of page-one rankings in 30 days.
- If data is unavailable, state assumptions clearly and recommend how to obtain the data.
