// Client-editable business details (via the CMS "Site settings" page).
import settings from "./content/settings.json";
// Header/footer chrome — logo, menus, CTA, footer headings (CMS "Header & footer").
import navigation from "./content/navigation.json";
// Which top-level pages are published (CMS dashboard → Pages).
import { isDraftPath } from "./pages.mjs";

export const site = {
  name: "Balga Designs",
  tagline: "Sustainable Landscapes",
  slogan: settings.slogan,
  brandLine: "Balga Designs – Sustainable Landscapes",
  // NAP source of truth — schema, footer, sitemap, llms all read this. Human-facing
  // fields come from the CMS (settings.json); the technical SEO fields stay here.
  contact: {
    address: settings.address,
    addressLocality: "Lennox Head",
    addressRegion: "NSW",
    postalCode: "2478",
    addressCountry: "AU",
    geo: { latitude: -28.7876, longitude: 153.5942 },
    email: settings.email,
    phone: settings.phone,
    phoneHref: "tel:" + settings.phone.replace(/[^\d+]/g, ""),
    // Derived from the CMS phone number — never a second copy to keep in sync.
    phoneE164: "+61" + settings.phone.replace(/[^\d]/g, "").replace(/^0/, ""),
    hours: settings.hours,
    openingHours: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "16:00" },
    serviceArea: settings.serviceArea,
    serviceAreas: ["Lennox Head", "Ballina", "Byron Bay", "Northern Rivers NSW", "Southern Gold Coast QLD"],
  },
  social: {
    facebook: settings.facebook,
    instagram: settings.instagram,
    google: settings.google,
  },
  video: {
    youtubeId: "pY_lOt_Yogk",
    // youtube-nocookie.com is YouTube's own privacy-preserving player host: same
    // video, same controls, but no tracking cookie until someone hits play.
    embed: "https://www.youtube-nocookie.com/embed/pY_lOt_Yogk?autoplay=1&rel=0",
    title: "Balga Designs — Sustainable Landscapes",
    description:
      "A short introduction to Balga Designs and our approach to beautiful, regenerative native gardens across the Northern Rivers to the Southern Gold Coast.",
    thumbnail: "https://i.ytimg.com/vi/pY_lOt_Yogk/hqdefault.jpg",
    // uploadDate intentionally omitted until the real YouTube publish date is confirmed.
  },
  developer: { name: "Jewell Projects", url: "https://jewellprojects.com/" },
  acknowledgement: settings.acknowledgement,
  logos: {
    white: navigation.logo,
    mark: "/assets/branding/logo-mark.png",
  },
};

export interface NavLink { label: string; href: string; }

// Unpublished (draft) pages drop out of every menu — the build also removes the
// page itself, so a link left behind would 404.
const live = (links: NavLink[]) => links.filter((l) => !isDraftPath(l.href));

export const nav = live(navigation.nav as NavLink[]);

export const footerLinks = {
  quicklinks: live(navigation.quicklinks as NavLink[]),
  support: live(navigation.support as NavLink[]),
};

// Editable labels/headings for the header and footer chrome.
export const header = {
  ctaLabel: navigation.headerCtaLabel,
  ctaHref: navigation.headerCtaHref,
};

export const footer = {
  contactHeading: navigation.footerContactHeading,
  quicklinksHeading: navigation.quicklinksHeading,
  supportHeading: navigation.supportHeading,
  copyrightName: navigation.copyrightName,
};
