// Image details set in the CMS media library (title, alt text, caption,
// description), keyed by the image's public URL.
//
// Alt text is the part the website uses: where a page doesn't carry its own alt
// text for an image, the library's alt is used instead — so describing an image
// once in the library covers it everywhere it appears.
import meta from "./media.json";

export interface MediaMeta {
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
}

const media = meta as Record<string, MediaMeta>;

export const mediaMeta = (src?: string): MediaMeta => (src && media[src]) || {};

/** The page's own alt text, falling back to the media library's. */
export const altFor = (src?: string, own?: string): string => own?.trim() || mediaMeta(src).alt || "";
