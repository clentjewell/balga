export interface FAQ {
  q: string;
  a: string[];
  category: string;
}

export const faqCategories = [
  "Cost & packages",
  "Timing & process",
  "Service area",
  "Plants, maintenance & sustainability",
  "Payment",
] as const;

export const faqs: FAQ[] = [
  // ---- Cost & packages ----
  {
    category: "Cost & packages",
    q: "How much does a native garden design cost near Lennox Head or Ballina?",
    a: [
      "Our Small NativeScapes Package starts at $2,500 for a small space (up to about 40 m²) within 30 km of Lennox Head, and larger design packages run to $4,500.",
      "The right package depends on the size and stage of your project. The Small NativeScapes Package is $2,500 and is ideal for compact yards and courtyards up to roughly 40 m². For a whole new garden, new build or renovation, the Complete Design Package is $4,500 and can be staged over time. We also offer a Potted Greenery / Pot Styling Package and a Balga Inspo (DIY-guidance) Package, both $2,000. Every design is naturalistic, native-led and built around the health of your local ecosystem.",
    ],
  },
  {
    category: "Cost & packages",
    q: "What's included in the $2,500 Small NativeScapes Package?",
    a: [
      "The Small NativeScapes Package includes an onsite assessment, a mood-board, a materials palette, a tailored plant list, one revision round, and 15 hours of install labour.",
      "It is designed for small spaces up to about 40 m² and is a roughly 20-hour job, available within 30 km of Lennox Head. You get a considered, water-wise native design plus hands-on installation help, so the garden is not just planned but actually planted. If your space is larger or part of a build, the Complete Design Package ($4,500) is usually the better fit.",
    ],
  },
  {
    category: "Cost & packages",
    q: "What are the differences between your design packages?",
    a: [
      "We offer four packages: Small NativeScapes ($2,500), Potted Greenery / Pot Styling ($2,000), Balga Inspo DIY-guidance ($2,000), and the Complete Design Package ($4,500).",
      "Small NativeScapes suits compact yards and includes install labour. Potted Greenery / Pot Styling is all about decorative potted plants for indoor and outdoor areas. Balga Inspo is for keen DIY gardeners who want an inspiration and guidance design to run with themselves. The Complete Design Package is our most thorough option for new builds and renovations, aligning the landscape plan with your construction and able to be staged. If you are unsure which one fits, tell us about your space and we will point you to the right starting point.",
    ],
  },
  {
    category: "Cost & packages",
    q: "Do you charge for a quote or first consultation?",
    a: [
      "No — your first consultation is free.",
      "We offer a free initial consultation to talk through your space, understand how you want to use it, and recommend the right package. Reach out through the contact form on our website, email info@balgadesigns.com.au, or message 041 373 1670, and we will take it from there — with no obligation.",
    ],
  },

  // ---- Timing & process ----
  {
    category: "Timing & process",
    q: "How long does a garden design take from start to finish?",
    a: [
      "Most designs are completed within a few weeks of the onsite assessment, depending on the size and scope of your project.",
      "The Small NativeScapes Package is around a 20-hour job that covers the onsite assessment, mood-board, materials palette, plant list, one revision round and 15 hours of install labour. Larger projects such as the Complete Design Package can be staged to suit your build timeline. We will always give you a clear timeframe once we have seen your space and understood the scope.",
    ],
  },
  {
    category: "Timing & process",
    q: "What should I expect when I work with Balga Designs?",
    a: [
      "We start with a free onsite consultation, then develop a mood-board, materials palette and tailored plant list, refine it through a revision round, and (on the relevant packages) install the garden for you.",
      "Our approach is warm, collaborative and rooted in Country. We listen to how you want to use the space, read the site and its local ecosystem, and design a naturalistic native garden that blends beauty with biodiversity. You are involved at each step, with room to give feedback before anything is planted. The result is a low-maintenance, water-wise garden that feels like it belongs where it is.",
    ],
  },
  {
    category: "Timing & process",
    q: "How do I book Balga Designs?",
    a: [
      "You can book a free consultation through the contact form on our website, by email at info@balgadesigns.com.au, or by messaging 041 373 1670.",
      "Get in touch with a few details about your space, your suburb and what you are hoping for, and we will recommend a package and next steps. Our hours are Monday to Friday, 07:00–16:00 AEST.",
    ],
  },

  // ---- Service area ----
  {
    category: "Service area",
    q: "Do you service my suburb? Do you work in Byron Bay and Ballina?",
    a: [
      "Yes — we work across the Northern Rivers in NSW through to the Southern Gold Coast in QLD, including Lennox Head, Ballina and Byron Bay.",
      "Balga Designs is a service-area studio based in Lennox Head, so we come to you. If you are anywhere between the Northern Rivers and the Southern Gold Coast, we would love to hear about your garden. Note that our Small NativeScapes Package is offered within 30 km of Lennox Head; for locations further afield, get in touch and we will let you know what we can do.",
    ],
  },

  // ---- Plants, maintenance & sustainability ----
  {
    category: "Plants, maintenance & sustainability",
    q: "Are native gardens really low-maintenance and water-wise?",
    a: [
      "Yes — a well-designed native garden is low-maintenance and water-wise because it uses plants suited to our local climate and soils.",
      "By choosing species that naturally belong in the Northern Rivers and coastal environment, your garden needs less watering, less feeding and less fuss than a conventional garden. Balga Designs specialises in naturalistic native gardens that look beautiful while supporting local ecosystem health, so you spend less time on upkeep and more time enjoying the space.",
    ],
  },
  {
    category: "Plants, maintenance & sustainability",
    q: "Why choose a native garden over a regular one?",
    a: [
      "Native gardens are water-wise, lower-maintenance and support local biodiversity, all while looking naturally at home in our region.",
      "Beyond the practical savings on water and upkeep, a native garden gives back to the environment around it — feeding local birds and pollinators and helping restore the native ecosystem. It is a beautiful, regenerative choice that is rooted in Country and true to where you live.",
    ],
  },
  {
    category: "Plants, maintenance & sustainability",
    q: "What does “sustainable” or “regenerative” landscaping actually mean at Balga Designs?",
    a: [
      "It means designing gardens that give more back to the local ecosystem than they take, using native planting, biodiversity, healthy soil and water-wise methods.",
      "Sustainability is at the heart of everything we do. We blend aesthetic appeal with environmental consciousness — restoring native ecosystems, promoting biodiversity, managing weeds without harming the garden, and advising on soil health and sustainable practices. The goal is a garden that is beautiful today and healthier for the land over time.",
    ],
  },
  {
    category: "Plants, maintenance & sustainability",
    q: "Can you help with weeds and pests without using harsh chemicals?",
    a: [
      "Yes — we offer Weed Control Consultation and Integrated Pest Management focused on sustainable methods that protect your garden's ecosystem.",
      "Rather than reaching straight for harsh chemicals, we give expert advice on sustainable ways to manage and prevent weeds, and we use integrated pest management to restore native ecosystems and promote biodiversity in your garden. It is a gentler, more ecological approach that keeps your soil, plants and local wildlife healthy.",
    ],
  },
  {
    category: "Plants, maintenance & sustainability",
    q: "Can you just recommend the right plants for my soil and conditions?",
    a: [
      "Yes — our Horticulture Consultation offers expert advice on plant selection, soil health and sustainable gardening practices.",
      "If you do not need a full design but want to plant with confidence, this is the service for you. We help you choose species that will thrive in your specific soil and conditions, improve soil health, and garden more sustainably — so your investment in plants pays off.",
    ],
  },

  // ---- Payment ----
  {
    category: "Payment",
    q: "How do I pay, and what payment methods do you accept?",
    a: [
      "We accept direct deposit, bank transfer and cash.",
      "Once you have chosen a package and we have confirmed the details, we will let you know how to settle payment via direct deposit, bank transfer or cash.",
    ],
  },
];

/** FAQs filtered to one or more categories (for curated sections on other pages). */
export const faqsByCategory = (cats: string[]): FAQ[] =>
  faqs.filter((f) => cats.includes(f.category));
