// Client-editable business details (via the CMS "Site settings" page).
import settings from "./content/settings.json";

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
    phoneE164: "+61413731670",
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
    embed: "https://www.youtube.com/embed/pY_lOt_Yogk?autoplay=1&rel=0",
    title: "Balga Designs — Sustainable Landscapes",
    description:
      "A short introduction to Balga Designs and our approach to beautiful, regenerative native gardens across the Northern Rivers to the Southern Gold Coast.",
    thumbnail: "https://i.ytimg.com/vi/pY_lOt_Yogk/hqdefault.jpg",
    // uploadDate intentionally omitted until the real YouTube publish date is confirmed.
  },
  developer: { name: "Jewell Projects", url: "https://jewellprojects.com/" },
  acknowledgement: settings.acknowledgement,
  logos: {
    white: "/assets/branding/logo-white.png",
    mark: "/assets/branding/logo-mark.png",
  },
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  { label: "Services", href: "/services/" },
  { label: "Projects", href: "/projects/" },
  { label: "Pricing", href: "/pricing/" },
  { label: "FAQs", href: "/faqs/" },
  { label: "Blog", href: "/balga-blog/" },
];

export const footerLinks = {
  quicklinks: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about/" },
    { label: "Services", href: "/services/" },
    { label: "Projects", href: "/projects/" },
    { label: "Blog", href: "/balga-blog/" },
  ],
  support: [
    { label: "FAQs", href: "/faqs/" },
    { label: "Contact", href: "/contact/" },
  ],
};
