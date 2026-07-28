---
name: maxxim-deliverable-format
description: "The canonical output format for every Maxxim document deliverable — pure semantic HTML5, written to the client's memory/generated tree and saved to Maxxim's secure storage. Reference material; all document-maker skills follow this."
metadata:
  phase: null
  output_file: null
---

# Deliverable Format

Every Maxxim document deliverable is written as a **complete, pure semantic
HTML5 document** — not markdown. HTML renders directly in the client dashboard
(an external stylesheet makes it pretty), and models read it just as well.

## Where to write it

```
memory/generated/<phase>/<skill-slug>.html
```

`<phase>` is `discover`, `design`, `deploy`, or `deepen` — the **document's**
phase in the taxonomy-v2 contract (`contracts/taxonomy-v2.json` in this plugin),
which is also the maker skill's phase. `<skill-slug>` is the document's slug
from that contract. A few special files live at the client-folder root:
`USER.html`, `MEMORY.html`.
After writing, run **maxxim-sync** (`--two-way`) to save it to Maxxim's secure
storage. When you tell the partner where a deliverable went, say "saved to Maxxim's
secure storage" — never mention R2, the proxy, tokens, or file paths.

## The document skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Audience Teardown — &lt;Client&gt;</title>
    <meta name="maxxim:client" content="<client-slug>">
    <meta name="maxxim:phase" content="discover">
    <meta name="maxxim:skill" content="audience-teardown">
    <meta name="maxxim:generated" content="<YYYY-MM-DD>">
  </head>
  <body>
    <h1>Audience Teardown</h1>
    <section>
      <h2>Section heading</h2>
      <p>Prose…</p>
      <ul><li>Point…</li></ul>
    </section>
  </body>
</html>
```

## Tag whitelist (use only these)

`html, head, title, meta, body, section, article, h1, h2, h3, h4, p, ul, ol, li,
strong, em, a[href], blockquote, code, pre, table, thead, tbody, tr, th, td,
figure, figcaption, img[src,alt], hr`

## Rules

- **No styling in the document.** No `style=`, no `class=`, no `<style>`, no
  `<link>`. The dashboard supplies the stylesheet. (`id=` only for an in-page
  anchor if genuinely needed.)
- **No scripts.** No `<script>`, no event handler attributes.
- `<h1>` once (the deliverable title); `<h2>`/`<h3>` for sections.
- Tabular data → `<table>`; lists → `<ul>`/`<ol>`; emphasis → `<strong>`/`<em>`.
- Escape literal `<`, `>`, `&` in text as `&lt;`, `&gt;`, `&amp;`.
- Keep it valid HTML5 (every element closed, correct nesting) — a push-time
  validator rejects disallowed tags/attributes.

## Cross-references

When a deliverable cites another, reference it by its **`.html`** filename
(e.g. "from `audience-teardown.html`"), since everything is HTML now.

## Group skills (one skill, several documents)

Many maker skills produce their whole taxonomy group — several **separate**
`.html` files in one run (their frontmatter lists `output_files`). Rules:

- **One file per document, each fully self-contained** — a client may open any
  one on its own. Never combine documents into one file, never emit a stub that
  just points at a sibling.
- Each file carries its **own** `<title>`, `<h1>` and `maxxim:skill` meta — the
  `maxxim:skill` value is the **document slug** (e.g. `customer-segments`), not
  the skill name.
- **No copy-paste duplication across siblings.** Each document owns its angle;
  where another document covers something, cross-reference it by filename.
- Validate every produced filename against the taxonomy contract before syncing
  — an unknown slug will not appear in the client's pipeline.
