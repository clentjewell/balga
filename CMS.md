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
- **Names:** every account has a display name. It's asked for when an admin adds a
  user, everyone can change their own under **My account**, and it's the name shown
  against changes on the dashboard.
- **My account** (everyone): change your own name and password.
- **Users** (admins only): add a user (name, email, temporary password, role),
  **Edit** a user — name, role and optionally a new password in one save, the way
  WordPress does it, with a blank password box meaning "leave it alone" — and
  delete a user. Guards stop you deleting your own account or removing the last
  admin.
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
  attributed by matching the author against the Content Manager accounts and showing
  that person's **name**. A change whose author isn't a registered account (an older
  change, or one made in the repository directly) is listed without a name rather
  than showing a GitHub identity.
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

## Projects and services

**Each project says which services it's an example of.** Editing a project shows
*Relevant services* — a checkbox per service. That service's page then shows the
project in its projects section. Tick nothing and the project simply doesn't appear
on any service page; if a service has no projects tagged, its project section is
left off the page entirely rather than padded with unrelated work.

Tagging lives on the project so adding one piece of work puts it on the right
service pages in a single step. (The mirror-image "related projects" picker on the
service editor is gone — one place to set this, not two.)

**The main services page is unconditional:** it keeps showing the three-project
preview regardless of tags, as does the home page. That trio is the first three
published projects in the client's own order — it used to be a hard-coded list,
which is why deleting a project once left its photos on those pages.

**Hide instead of delete:** each project has a *Hide this project* checkbox. Hidden
work drops off the Projects page, both previews and any service page immediately,
stays in the CMS marked **Hidden**, and is flagged as hidden in pickers.

**Deleting never removes photos.** A delete removes only the project's own entry —
every uploaded image stays in the media library for reuse, and the delete
confirmation says so.

## Images — the media library

Every image field opens the **media library**: a grid of every image already on the
site (`public/assets/**`), with a search box and an **Upload new image** button, the
WordPress pattern. Choosing an existing image is the default path; uploading is one
option rather than the only one, which stops the same photo being uploaded five
times under five names.

Selecting an image shows its **details**, WordPress-style: **title, alt text,
caption, description** and a **Copy** button for the file URL. Details are stored
in `src/data/media.json`, keyed by the image's public URL, and saved with
`PUT /cms-api/media-meta`.

**Alt text is the part the website uses.** `src/data/media.ts` exposes
`altFor(src, own)`, and the page templates call it: a page's own alt text wins,
and where a page hasn't got any, the library's alt text is used. Choosing an image
in the editor also copies its library alt into that field's alt box when the box is
empty — the same thing WordPress does on insert, and it never overwrites text
someone has already written.

The **Testimonials background image** has no alt-text box in the editor at all: its
alt text comes from the media library alone. The other image fields still keep
their own alt boxes; the same swap can be made for any of them by deleting the
`…Alt` field from `public/cms-config.json` and dropping the second argument to
`altFor()` in the template. Title, caption and description are stored for the
client's own organisation; nothing on the site renders them yet.

The library is one recursive tree call (`GET /cms-api/media`), cached for the
session and invalidated after an upload. Uploads still go to the field's own
`mediaFolder`.

A **just-uploaded image only reaches the live site after the next build**, so its
public URL 404s for a minute or two. Thumbnails and previews fall back to
`GET /cms-api/media-file?path=…`, which reads the file straight from the repo, so
new uploads are visible in the CMS immediately.

## Contact enquiries + outgoing email

Every valid contact-form submission is **stored first** (KV) and shows on the
dashboard, so enquiries are captured whether or not email is switched on. The email
is the notification on top of that.

### How mail leaves the site

Cloudflare Workers can't hand a message to an SMTP server the way a normal web host
would — outgoing mail has to go over HTTPS. Two routes are supported, tried in this
order by `sendMail()` in `src/cms/handler.js`:

**1. Google Workspace (recommended here — the client's mail already lives there).**
A small Apps Script web app runs in the client's own Google account and sends the
mail from their mailbox. No third-party sending service, nothing to pay for, and no
SPF/DKIM changes, because the mail genuinely is sent by their account.

Setup is in [`docs/google-workspace-mailer.gs`](docs/google-workspace-mailer.gs) —
paste the script, deploy it as a web app, then:

```bash
npx wrangler secret put GAS_MAIL_URL      # the /exec URL of the deployment
npx wrangler secret put GAS_MAIL_TOKEN    # the shared token from the script
```

**2. Resend**, if a sending service is ever preferred: `npx wrangler secret put
RESEND_API_KEY` (plus optional `CONTACT_FROM_EMAIL`). Only used when the Workspace
relay isn't configured.

Notifications go to `CONTACT_TO_EMAIL` if set, otherwise to the business email from
**Site settings**. If a send fails, the visitor still gets a "received" reply and the
enquiry is on the dashboard — a delivery problem never loses a lead.

### What this also switches on

The same mailer powers **Forgot password**: a one-time link (30 minutes, single use)
to set a new password. Until either route is configured the screen says so, and
admins can still reset passwords under **Users**. Reset requests answer identically
whether or not the email has an account, so the form can't be used to discover who
has one.

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

## SEO / GEO — Layer 1

The site is audited against the Maxxim Layer 1 checklist by `npm run audit`, which
runs on every publish and blocks a deploy on any ERROR. What it enforces:
LocalBusiness + WebSite JSON-LD, sitemap / robots / llms.txt, per-page
title + description + canonical + OG (**including that the og:image really exists
in the build**), exactly one `<h1>` with no skipped heading levels, alt text on
every image, and width/height on every image so pages don't shift as they load.

Two build-time mechanisms keep it that way without hand-maintenance:

- **Image dimensions** are written into the built HTML from the real files, so
  markdown images and CMS-swapped images get them automatically.
- **NAP comes only from `src/data/content/settings.json`** (the CMS "Site settings"
  screen). The schema, footer, llms.txt, contact-form copy and the Worker's error
  messages all read it, so the business's phone/email/address can never drift.

**Before the site goes to its production domain**, build with `SITE_URL` set to the
real hostname and `PUBLIC_NOINDEX=false`, and set the Worker var `PREVIEW_NOINDEX`
to `"false"`. Until then robots.txt disallows everything and pages carry
`X-Robots-Tag: noindex` — correct for a preview, fatal if it ships that way.

## Security

Hardening applied ahead of go-live (a passive scan of the deployed site drove this):

- **Content-Security-Policy names every inline script by SHA-256 hash** instead of
  allowing `'unsafe-inline'`. The build hashes each page's inline scripts into
  `dist/_cms/csp.json`; the Worker emits a per-page policy from it. If XSS ever got
  into a page, the browser would refuse to run it. `npm run audit` fails the build
  if a page's inline script isn't covered, so it can't silently regress.
  `style-src` keeps `'unsafe-inline'` — Astro emits scoped styles, and style
  injection is cosmetic next to script injection.
- **HSTS** (`max-age=31536000`), plus `object-src 'none'` and
  `upgrade-insecure-requests`. `includeSubDomains` and `preload` are deliberately
  left off until the production domain is live and its subdomains are confirmed
  HTTPS — both are hard to undo once browsers cache them.
- **Rate limits** (KV, fixed 15-minute window, self-expiring — nobody is locked out
  permanently): sign-in 10 attempts per IP *and* per account; password-reset
  requests 5 per IP; contact form 5 submissions per IP. A successful sign-in clears
  the counter, and a KV outage fails open rather than locking the client out.
- **Signed-in-only paths**: `/_cms/*` (build reports), `/cms-config.json` (the CMS
  schema — no secrets, but it maps the repo) and `/review/*` (the internal planning
  doc). Signed-out visitors get the normal 404.
- A **malformed session cookie** is treated as "not signed in" rather than throwing
  a 500.

Already in place and verified: `HttpOnly; Secure; SameSite=Strict` session cookie,
every CMS endpoint 401s unauthenticated, no CORS headers, no directory listings, no
source maps, generic login errors, and no user enumeration on password reset.

**Still worth doing outside the code:** a Cloudflare WAF rate-limiting rule in front
of `/cms-api/login` (defence in depth over the app-level limit), Turnstile on the
contact form if spam appears, and an [SSL Labs](https://www.ssllabs.com/ssltest/)
run once the production domain is live.

## Notes / limits

- The shared-sections file now also carries the **Testimonials** section heading,
  intro and backdrop (they used to be hard-coded in the component).
- Editable content: **every page** (hero, headings, CTAs, images) + shared sections
  (Why choose us, How we work, Video band, CTA, hero cards) + Projects, Services,
  Pricing packages, Blog posts, FAQs, Testimonials, and the **Header & footer**
  (logo, menus, footer links). All schema-driven from `public/cms-config.json`.
- Password reset is admin-managed (no email service required). Self-service email
  reset would need an email provider (API key + verified sender domain).
