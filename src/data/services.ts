export interface ServiceDetail {
  /** SEO title (brand appended by BaseLayout). */
  seoTitle: string;
  metaDescription: string;
  whatItIs: string;
  whenYouNeed: string;
  whatsInvolved: string;
  whyBalga: string;
}

export interface Service {
  slug: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  /** ids of related projects (see src/data/projects.ts) to showcase; empty = no section. */
  relatedProjects: string[];
  /** project id whose photo illustrates the two-column content (distinct from hero + related). */
  contentProject: string;
  detail: ServiceDetail;
}

export const services: Service[] = [
  {
    slug: "landscape-design",
    relatedProjects: ["project-01","project-02","project-07"],
    contentProject: "project-03",
    title: "Landscape Design",
    description:
      "Custom designs that blend aesthetic appeal with environmental consciousness.",
    image: "/assets/services/landscape-design.webp",
    alt: "Detailed landscape design plan for a native Australian garden",
    width: 800,
    height: 750,
    detail: {
      seoTitle: "Landscape Design | Native Garden Design",
      metaDescription:
        "Custom native landscape design across the Northern Rivers to Southern Gold Coast — water-wise, low-maintenance gardens from $2,500 with Balga Designs.",
      whatItIs:
        "A custom landscape design that blends aesthetic appeal with environmental consciousness, tailored to your space and your local ecosystem.",
      whenYouNeed:
        "When you want to reimagine a whole garden — a new outdoor area, a tired yard, or a blank canvas you want done thoughtfully and sustainably from the ground up.",
      whatsInvolved:
        "Our design packages range from the Small NativeScapes Package at $2,500 (small spaces up to about 40 m² within 30 km of Lennox Head — including an onsite assessment, mood-board, materials palette, tailored plant list, one revision round and 15 hours of install labour) through to the Complete Design Package at $4,500 for new builds and renovations, which can be staged over time. It all starts with a free consultation.",
      whyBalga:
        "We create naturalistic native gardens that are water-wise, low-maintenance and rooted in Country — beautiful spaces that also support the health of the land they sit on.",
    },
  },
  {
    slug: "garden-facelift",
    relatedProjects: ["project-06","project-02","project-04"],
    contentProject: "project-01",
    title: "Garden Facelift",
    description:
      "Tailored to harmonise with the natural environment, creating spaces that are both functional and beautiful.",
    image: "/assets/services/garden-facelift.webp",
    alt: "Regenerated native garden with grasses overlooking the hills",
    width: 1000,
    height: 750,
    detail: {
      seoTitle: "Garden Facelift | Sustainable Garden Renovation",
      metaDescription:
        "Revive an overgrown or dated garden with a sustainable Balga Designs facelift — native, low-maintenance and beautiful, across the Northern Rivers.",
      whatItIs:
        "A refresh of your existing garden, tailored to harmonise with the natural environment and create a space that is both functional and beautiful.",
      whenYouNeed:
        "When your garden has good bones but has become overgrown, dated or unloved, and you want to bring it back to life without starting completely from scratch.",
      whatsInvolved:
        "Every facelift is shaped around your space and goals — we work with what is already there. Book a free consultation and we will scope the work and give you a tailored quote.",
      whyBalga:
        "We work with what is already there and with the local ecosystem, so your revived garden feels natural, sustainable and easy to care for.",
    },
  },
  {
    slug: "decorative-plants",
    relatedProjects: ["project-04","project-02"],
    contentProject: "project-06",
    title: "Decorative Plants",
    description:
      "Enhance your space by incorporating potted greenery, bringing an organic and stylish feel to your indoor & outdoor area.",
    image: "/assets/services/decorative-plants.webp",
    alt: "Styled decorative potted plants",
    width: 1000,
    height: 989,
    detail: {
      seoTitle: "Decorative Plants & Pot Styling",
      metaDescription:
        "Style indoor and outdoor spaces with potted greenery — Balga Designs' Pot Styling Package ($2,000) brings an organic, healthy feel to any space.",
      whatItIs:
        "Styling your space with potted greenery to bring an organic, stylish feel to both indoor and outdoor areas.",
      whenYouNeed:
        "When you want greenery and warmth without a full garden build — perfect for balconies, courtyards, entrances, patios and interiors.",
      whatsInvolved:
        "Our Potted Greenery / Pot Styling Package is $2,000 and centres on selecting and arranging potted plants to suit your space and style.",
      whyBalga:
        "We choose plants that thrive in your conditions and pair them beautifully with your space, so the result looks considered and stays healthy.",
    },
  },
  {
    slug: "integrated-pest-management",
    relatedProjects: ["project-03","project-07"],
    contentProject: "project-02",
    title: "Integrated Pest Management",
    description:
      "Restoring native ecosystems and promoting biodiversity within your garden.",
    image: "/assets/services/pest-management.webp",
    alt: "Cottage-feel native garden bed supporting biodiversity",
    width: 1000,
    height: 750,
    detail: {
      seoTitle: "Integrated Pest Management | Chemical-Free",
      metaDescription:
        "Chemical-free, ecological pest management from Balga Designs — restore native ecosystems and biodiversity in your Northern Rivers garden. Book a free consultation.",
      whatItIs:
        "A sustainable approach to managing pests that restores native ecosystems and promotes biodiversity within your garden.",
      whenYouNeed:
        "When pests are affecting your garden and you want them managed without harsh chemicals that damage soil, plants and local wildlife.",
      whatsInvolved:
        "We assess your garden and apply integrated, ecological pest-management methods suited to your site. Book a free consultation and we will tailor a plan and quote to your garden.",
      whyBalga:
        "Our methods work with nature, not against it — protecting the biodiversity that keeps your garden resilient over the long term.",
    },
  },
  {
    slug: "weed-control",
    relatedProjects: ["project-05","project-03"],
    contentProject: "project-04",
    title: "Weed Control Consultation",
    description:
      "Get expert advice on sustainable methods to manage and prevent weeds without harming your garden's ecosystem.",
    image: "/assets/services/weed-control.webp",
    alt: "Bio-control weed management in a native landscape",
    width: 1000,
    height: 750,
    detail: {
      seoTitle: "Weed Control Consultation | Low-Harm",
      metaDescription:
        "Sustainable, low-harm weed management advice from Balga Designs — keep weeds in check without damaging your garden's ecosystem, across the Northern Rivers.",
      whatItIs:
        "Expert advice on sustainable methods to manage and prevent weeds without harming your garden's ecosystem.",
      whenYouNeed:
        "When weeds keep taking over and you want a lasting, low-harm strategy rather than a quick chemical fix.",
      whatsInvolved:
        "We review your weed issues and advise on sustainable prevention and control tailored to your garden. Start with a free consultation and we will recommend a plan.",
      whyBalga:
        "We help you keep weeds in check while protecting your soil, your plants and the native ecosystem around them.",
    },
  },
  {
    slug: "horticulture-consultation",
    relatedProjects: ["project-07","project-03"],
    contentProject: "project-05",
    title: "Horticulture Consultation",
    description:
      "Expert advice on plant selection, soil health, and sustainable gardening practices.",
    image: "/assets/services/horticulture.webp",
    alt: "Established native garden bed",
    width: 1000,
    height: 750,
    detail: {
      seoTitle: "Horticulture Consultation | Plants & Soil",
      metaDescription:
        "Expert plant selection, soil health and sustainable gardening advice from Balga Designs — garden with confidence across the Northern Rivers to Southern Gold Coast.",
      whatItIs:
        "Expert advice on plant selection, soil health and sustainable gardening practices.",
      whenYouNeed:
        "When you want to garden with confidence — choosing the right plants, improving your soil, and adopting sustainable habits — without necessarily commissioning a full design.",
      whatsInvolved:
        "A consultation focused on your plants, soil and goals. Book a free consultation and we will tailor the advice to your garden.",
      whyBalga:
        "Our advice is grounded in local knowledge and ecological thinking, so your garden thrives naturally and sustainably.",
    },
  },
];
