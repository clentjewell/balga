// Shared sections are edited in the CMS (Pages & Settings → "Shared sections").
// Anything here reflects on every page that renders the matching component.
import sections from "./content/sections.json";

export interface Pillar { title: string; text: string; }
export interface Step { title: string; text: string; }
export interface HeroFeature { title: string; text: string; icon: string; }

export const whyChooseUs = {
  eyebrow: sections.whyChooseEyebrow,
  title: sections.whyChooseTitle,
  intro: sections.whyChooseIntro,
  image: sections.whyChooseImage,
  imageAlt: sections.whyChooseImageAlt,
  pillars: sections.whyChoosePillars as Pillar[],
};

export const howWeWork = {
  eyebrow: sections.howWeWorkEyebrow,
  steps: sections.howWeWorkSteps as Step[],
};

export const videoBand = {
  eyebrow: sections.videoBandEyebrow,
  title: sections.videoBandTitle,
  image: sections.videoBandImage,
};

export const defaultCta = {
  title: sections.ctaTitle,
  image: sections.ctaImage,
};

export const heroFeatures = sections.heroFeatures as HeroFeature[];

export const counters = [
  { value: 14, suffix: "+", label: "Years Experience" },
  { value: 1.2, suffix: "K+", label: "Happy Clients", decimals: 1 },
  { value: 85, suffix: "+", label: "Professional Team" },
  { value: 210, suffix: "+", label: "Complete Projects" },
];
