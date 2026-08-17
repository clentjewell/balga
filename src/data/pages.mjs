/**
 * The site's top-level pages, and whether each one is published.
 *
 * Plain JS (not .ts) so `astro.config.mjs` can import it too: the build uses this
 * to drop drafted pages out of `dist/`, the sitemap and llms.txt, while `site.ts`
 * uses it to drop them out of the header/footer menus.
 *
 * Status lives in `src/data/content/page-status.json` and is written by the CMS
 * dashboard (Publish / Unpublish). Pages marked `locked` can't be unpublished —
 * a site without a home or contact page is never what the client meant.
 */
import status from "./content/page-status.json";

/** @typedef {{ key: string, label: string, path: string, locked?: boolean }} PageEntry */

/** @type {PageEntry[]} */
export const pages = [
  { key: "home", label: "Home", path: "/", locked: true },
  { key: "about", label: "About", path: "/about/" },
  { key: "services", label: "Services", path: "/services/" },
  { key: "projects", label: "Projects", path: "/projects/" },
  { key: "pricing", label: "Pricing", path: "/pricing/" },
  { key: "faqs", label: "FAQs", path: "/faqs/" },
  { key: "blog", label: "Blog", path: "/balga-blog/" },
  { key: "contact", label: "Contact", path: "/contact/", locked: true },
];

/** Status for one page — anything but the string "draft" counts as published. */
export const isPublished = (key) => {
  const entry = pages.find((p) => p.key === key);
  if (entry && entry.locked) return true;
  return (/** @type {Record<string,string>} */ (status))[key] !== "draft";
};

/** Paths of pages the client has unpublished, e.g. ["/pricing/"]. */
export const draftPaths = pages.filter((p) => !isPublished(p.key)).map((p) => p.path);

/** True if a menu link points at an unpublished page. */
export const isDraftPath = (href) => draftPaths.includes(href);
