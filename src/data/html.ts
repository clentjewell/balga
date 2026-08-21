/**
 * Turning CMS text into HTML safely.
 *
 * Everything on this site is typed by someone signed into the Content Manager,
 * so this isn't about anonymous attackers — it's about making sure one stolen
 * password can't reach further than the words on a page.
 */

/**
 * JSON for a <script type="application/ld+json"> block.
 *
 * Astro's set:html deliberately skips escaping, and JSON.stringify leaves
 * "</script>" untouched — so a CMS field containing one would close the block
 * early and let the rest of the value become live markup on every page.
 * Escaping each "<" as a unicode escape is invisible to any JSON parser
 * (Google's included) and makes that breakout impossible.
 */
export const jsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");

// The handful of tags a CMS field may carry: a link and light emphasis.
const INLINE = new Set(["strong", "em", "b", "i", "br"]);
// Site-relative, absolute http(s), mail, phone, or an on-page anchor. The
// negative lookahead rejects "//evil.example", which is a URL to another host
// wearing a site-relative disguise.
const SAFE_HREF = /^(?:\/(?![/\\])|https?:\/\/|mailto:|tel:|#)/i;

/**
 * The small amount of formatting a rich-text CMS field is allowed to keep.
 *
 * Anything outside the allowlist — script, iframe, event handlers, javascript:
 * URLs, style — is dropped rather than escaped, so the sentence still reads
 * correctly instead of sprouting visible angle brackets. Allowed tags are
 * rebuilt from scratch rather than passed through, which is what stops an
 * attribute smuggling something in on an otherwise innocent <strong>.
 */
export function richText(input: string | undefined | null = ""): string {
  return String(input ?? "").replace(
    // Match a whole tag, tolerating > inside quoted attribute values.
    /<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (raw, rawName: string, attrs: string) => {
      const name = rawName.toLowerCase();
      const closing = raw.startsWith("</");
      if (INLINE.has(name)) return closing ? `</${name}>` : `<${name}>`;
      if (name !== "a") return "";
      if (closing) return "</a>";
      const m = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const href = (m ? (m[1] ?? m[2]) : "").trim();
      if (!SAFE_HREF.test(href)) return "";
      const external = /^https?:\/\//i.test(href);
      return `<a href="${href.replace(/"/g, "&quot;")}"${external ? ' target="_blank" rel="noopener"' : ""}>`;
    },
  );
}
