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

`GH_OWNER` / `GH_REPO` / `GH_BRANCH` are already set as vars in `wrangler.jsonc`
(currently the `claude/...` branch — change to `main` when the site is promoted).

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

## Notes / limits

- Editable content: **every page** (hero, headings, CTAs, images) + shared sections
  (Why choose us, How we work, Video band, CTA, hero cards) + Projects, Services,
  Pricing packages, Blog posts, FAQs, Testimonials, and the **Header & footer**
  (logo, menus, footer links). All schema-driven from `public/cms-config.json`.
- Password reset is admin-managed (no email service required). Self-service email
  reset would need an email provider (API key + verified sender domain).
