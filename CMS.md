# Balga Designs — Content Manager (custom CMS)

A lightweight, custom CMS so the client can edit the site with **email + password**
(no GitHub account needed). It mirrors the Pottsville pattern, rebuilt for Cloudflare:

```
Client → /admin (email + password) → Cloudflare Worker verifies
      → commits the change to the repo with a bot token
      → GitHub Action builds + deploys → live in ~1–2 min
```

- **Admin UI:** `/admin/` (static, `public/admin/index.html`) — schema-driven from `public/cms-config.json`.
- **Backend:** `src/cms/handler.js`, wired into `src/worker.js` at `/cms-api/*` (auth + GitHub read/write/upload).
- **Content edited:** Projects (add/edit/delete), Services (edit + pick related projects), Blog posts (add/edit/delete, with images). All stored in the repo:
  - `src/data/projects/*.json`, `src/data/services/*.json`, `src/content/blog/*.md`
  - Uploaded images commit to `public/assets/**/uploads/`.

## Activation — 3 things to set (one-time)

Nothing is committed in plain text; all of the below live in Cloudflare's encrypted
secret store or GitHub Actions secrets — never in the repo.

### 1. Cloudflare Worker secrets (login + GitHub bot token)

```bash
npx wrangler secret put CMS_EMAIL            # the client's login email
npx wrangler secret put CMS_PASSWORD         # a strong password
npx wrangler secret put CMS_SESSION_SECRET   # any long random string
npx wrangler secret put GITHUB_TOKEN         # a GitHub token (below)
```

**GITHUB_TOKEN** — a *fine-grained personal access token* (github.com → Settings →
Developer settings → Fine-grained tokens), scoped to **this repo only**, with
**Repository permissions → Contents: Read and write**. This is the "bot" that commits
the client's edits. The client never sees it.

`GH_OWNER` / `GH_REPO` / `GH_BRANCH` are already set as vars in `wrangler.jsonc`.
The site is promoted: `GH_BRANCH` is **`main`**, and the Build & Deploy workflow
runs on pushes to `main` — so a CMS save commits to `main` and deploys from it.

### 2. GitHub Actions secrets (auto build + deploy on each save)

In the repo → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — token with **Workers Scripts: Edit** (+ Account → Workers
  Assets/Builds) permission.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.

Until these exist, the workflow still builds/audits but skips the deploy step.

### 3. Give the client the link

`https://<your-domain>/admin/` and their email + password. Done.

## How saving works

- Each save commits the file to `GH_BRANCH` → the **Build & Deploy** Action runs
  `npm run build && npm run audit && wrangler deploy`.
- The audit gate means a broken save can't take the site down — a bad edit fails CI
  and the previous version stays live.

## Users & passwords (multi-user)

User accounts live in a Cloudflare **KV namespace** (binding `CMS_USERS` in
`wrangler.jsonc`). On first login the store seeds itself from the `CMS_EMAIL` /
`CMS_PASSWORD` secrets as the first **admin**, so the original login keeps working.

- **Roles:** *Admin* (edit content **and** manage users) and *Editor* (edit content only).
- **My account** (everyone): change your own password.
- **Users** (admins only): add a user, delete a user, switch a user's role, and
  reset any user's password. Guards stop you deleting your own account or removing
  the last admin.
- **Forgot password:** an admin resets it from **Users**. If the *only* admin is
  locked out, reset the seed by clearing the KV record (or `wrangler kv key delete
  "user:<email>" --binding CMS_USERS`) — it re-seeds from `CMS_PASSWORD` on next login.

Passwords are stored only as PBKDF2-SHA256 hashes; the `CMS_PASSWORD` secret is just
the seed. Sessions last 8 hours and carry the role.

## Dashboard

Signing in lands on **Dashboard** (first item in the sidebar; everything else is
unchanged). Five cards:

- **Contact enquiries** — every message sent through the website's contact form,
  with total / unread / read counts. Opening one marks it read. Enquiries are stored
  in KV *before* the notification email is attempted, so they're captured even
  though Resend isn't set up yet (see below).
- **Broken links** — from the link check that runs with every publish
  (`npm run audit`). Separates genuinely dead links from links pointing at a page
  the client has unpublished, and ignores sites that merely block robots (a 429 from
  Instagram is not a broken link).
- **Last 20 changes** — who changed what, when, in the client's own terms:
  "Updated testimonial “Jane D.” · by sarah · 2 hours ago". Only changes made in
  the Content Manager appear; developer commits, merges and deploys are filtered
  out, because this is a record of the website, not of the repository. Changes are
  attributed to the signed-in user rather than the shared bot token.
- **Pages** — publish / unpublish each page (below), plus a **+ New page** button
  that explains new pages need design work and to contact the admin.
- **Blog posts** — the post list with Edit, plus New post.

### Publishing and unpublishing pages

Status lives in `src/data/content/page-status.json` (`published` | `draft`) and is
written by the dashboard. On the next build an unpublished page is **deleted from
`dist/`** (so the URL falls through to the 404 page) and dropped from the menus,
the sitemap and `llms.txt`. Nothing is deleted from the repo — publishing it again
restores it exactly.

Home and Contact are locked: a site should never be able to lose them. New pages
are deliberately not self-serve; they need layout/design work.

Any links *inside page content* that point at a page the client unpublishes show up
on the Broken links card as "points at a page you've unpublished".

## Images — the media library

Every image field opens the **media library**: a grid of every image already on the
site (`public/assets/**`), with a search box and an **Upload new image** button, the
WordPress pattern. Choosing an existing image is the default path; uploading is one
option rather than the only one, which stops the same photo being uploaded five
times under five names.

The library is one recursive tree call (`GET /cms-api/media`), cached for the
session and invalidated after an upload. Uploads still go to the field's own
`mediaFolder`.

## Contact enquiries + email (Resend)

The contact form (`POST /api/contact`) stores every valid submission in KV and then
tries to email it. Setting `RESEND_API_KEY` (plus optional `CONTACT_TO_EMAIL` /
`CONTACT_FROM_EMAIL`) with `wrangler secret put` switches the email on; until then
submissions are still captured and visible on the dashboard.

The same key powers **Forgot password**: the client gets a one-time link (30 minutes,
single use) to set a new password themselves. Until `RESEND_API_KEY` exists the
screen says so and admins can still reset passwords under **Users**. Reset requests
answer identically whether or not the email has an account, so the form can't be
used to discover who has one.

## FAQs — ordering and categories

The FAQs screen lists the questions **grouped by category**, in the order they
appear on the site. Ordering is drag-and-drop:

- Drag a question by its **⠿** handle to move it up or down inside a category, or
  drop it in a different category heading to move it there.
- Nothing is published until **Save new order** — the whole reshuffle then goes up
  as a *single* commit (one build, one deploy) via `PUT /cms-api/files`.
- Adding a question asks only for **category, question and answer**. The filename
  (`faq-16`) and the sort position are filled in automatically, and a new question
  lands at the end of its category.

This is driven from `public/cms-config.json`, so any collection can behave the same
way: `"reorder": true`, `"groupField": "<field>"`, `"autoId": {"prefix":"faq-","pad":2}`,
`"autoOrder": true`, plus `"hidden": true` on the id/order fields.

## Notes / limits

- The shared-sections file now also carries the **Testimonials** section heading,
  intro and backdrop (they used to be hard-coded in the component).
- Editable content: **every page** (hero, headings, CTAs, images) + shared sections
  (Why choose us, How we work, Video band, CTA, hero cards) + Projects, Services,
  Pricing packages, Blog posts, FAQs, Testimonials, and the **Header & footer**
  (logo, menus, footer links). All schema-driven from `public/cms-config.json`.
- Password reset is admin-managed (no email service required). Self-service email
  reset would need an email provider (API key + verified sender domain).
