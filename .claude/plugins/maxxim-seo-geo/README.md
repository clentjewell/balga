# maxxim-seo-geo

The Maxxim SEO/GEO skill layer, packaged standalone so it can be dropped into
another repo (e.g. the Balga design repo) without pulling in the whole Maxxim plugin.

## What's in here

| Skill | Layer | Writes |
|---|---|---|
| `maxxim-seo-standards` | Layer 1 — build-time | nothing (reference; the site audit enforces it) |
| `maxxim-seo-upgrade` | Layer 1 retrofit | nothing (patches source, then build → deploy) |
| `maxxim-seo-content` | Layer 3 — GEO copy | `memory/generated/deploy/seo-content.html` |
| `maxxim-citations-playbook` | Layer 3 — local citations | `memory/generated/deploy/citations-playbook.html` |
| `maxxim-seo-strategy` | Design-phase document | `memory/generated/design/seo-strategy.html` |
| `maxxim-deliverable-format` | shared reference | nothing |

`maxxim-deliverable-format` is included because three of the skills above reference
it for output format. It isn't an SEO skill.

## Install

**Option A — as a plugin.** Copy the whole `maxxim-seo-geo/` folder (including the
hidden `.claude-plugin/` directory) into the repo's plugin location, or add it to a
marketplace manifest. Verify the hidden folder survived the copy:

```bash
ls -a maxxim-seo-geo/.claude-plugin
```

**Option B — as plain repo skills.** Copy the contents of `skills/` into the repo's
`.claude/skills/` directory:

```bash
cp -R maxxim-seo-geo/skills/* .claude/skills/
```

Each skill keeps its own folder name, which is what the relative cross-references
between skills resolve against. Don't flatten or rename the folders.

## Before it will run cleanly

Two things to check, because these skills were written for the Maxxim platform:

**1. Unresolved cross-references.** The skills link to platform siblings that are
*not* in this bundle:

- `maxxim-web-build`, `maxxim-web-deploy`, `maxxim-web-review`, `maxxim-website-edit`
- `maxxim-sync`
- `maxxim-document`

`maxxim-seo-upgrade` leans on these hardest — its whole flow is audit → patch source
→ rebuild → redeploy, and the rebuild/redeploy half lives in those skills. Either port
them too, or rewrite that section against whatever the Balga repo's build and deploy
commands actually are.

**2. Hard-coded Maxxim assumptions.** These need translating to the target repo:

- `src/site.config.ts` as the single source of business NAP facts
- `scripts/audit-site.mjs` as the audit that fails a non-compliant build
- the `memory/generated/{design,deploy}/` output tree
- an Astro site with a locked/unlocked distinction

If the Balga repo isn't Astro with the same config file, `maxxim-seo-standards` and
`maxxim-seo-upgrade` need their file paths remapped before they'll do anything useful.
`maxxim-seo-content`, `maxxim-citations-playbook` and `maxxim-seo-strategy` are more
portable — they mostly produce documents.

## Note on `maxxim-seo-strategy`

Two copies exist upstream and they've drifted. This bundle ships the `maxxim`
namespace version: `phase: design`, writing to `memory/generated/design/`. The older
`maxxim-plugin` copy has `phase: deploy` writing to `memory/generated/deploy/`.
Bodies are otherwise identical. Worth settling which one is canonical before this
gets copied further.

One reference was normalised on the way in: `maxxim-seo-strategy` linked to
`../deliverable-format/SKILL.md`, but the skill's actual folder name is
`maxxim-deliverable-format`. Fixed here; still broken upstream.
