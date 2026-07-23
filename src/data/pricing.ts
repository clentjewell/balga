export interface Package {
  number: number;
  title: string;
  subtitle: string;
  price: string;
  hours: string;
  radius: string;
  image: string;
  alt: string;
  intro: string[];
  includedIntro: string;
  included: string[];
  notes: string[];
}

export const packages: Package[] = [
  {
    number: 1,
    title: "Package 1 - The Small NativeScapes Package",
    subtitle: "The Small Spaces Design Package",
    price: "$2,500.00",
    hours: "Approximately 20 Hour Job",
    radius: "Within 30km radius from Lennox Head",
    image: "/assets/pricing/package-1.jpg",
    alt: "Small native garden design",
    intro: [
      "The Small NativeScapes Package is designed for those looking to revamp their front/backyards without the guesswork.",
      "If you desire a practical and visually pleasing transformation in an area up to 40m2, but aren’t sure where to start, this package is for you.",
      "We specialise in creating functional native orientated designs, incorporating cost- effective elements and low-maintenance species to allow you to reconnect with your garden.",
    ],
    includedIntro: "Let us simplify the process and bring your vision to life. What’s included:",
    included: [
      "Onsite Assessment – We’ll meet on-site, measure up, and get a feel for your space;",
      "Mood-board Presentation;",
      "Materials Palette suited to your budget – This may include furniture, pots and hardscape materials;",
      "Plant species – We will develop a list of native plants suitable to your site;",
      "Refinement Round – One round of revisions to ensure the design meets your needs;",
      "15H Labour included for design installation.",
    ],
    notes: [
      "*Steep/complex sites may require additional fees – To be discussed at the first meeting.",
      "**Adding in extra garden beds and expanding the area may require additional fees.",
    ],
  },
  {
    number: 2,
    title: "Package 2 - The Potted Greenery Package",
    subtitle: "Pot Styling and Decorative Plants Package",
    price: "$2,000.00",
    hours: "Approximately 20 Hour Job",
    radius: "Within 30km radius from Lennox Head",
    image: "/assets/pricing/package-2.jpeg",
    alt: "Pot styling and decorative plants",
    intro: [
      "Ideal for those who are renting a property, our pot styling consultation is perfect for clients who are wanting to incorporate potted greenery in an indoor or outdoor space but aren’t sure where to begin.",
      "Also, for homeowners who are selling their home and want to elevate their space by styling their home garden.",
      "After the consultation, you will receive a plan that identifies the selected pots, location of pots, and specifies plants for each pot.",
    ],
    includedIntro: "What’s included:",
    included: [
      "Onsite Assessment – in person consultation;",
      "Pot styling design package – selecting plants, pots and location for each one of these elements in the space;",
      "Quotation for pots, plants and materials;",
      "Refinement Round – One round of revisions to ensure the design meets your needs;",
      "Installation and styling – Adhering to horticultural good practices planting and styling;",
      "Follow up Appointment – One time follow up appointment for a plant check and further recommendations.",
    ],
    notes: [],
  },
  {
    number: 3,
    title: "Package 3 - Balga Inspo Package",
    subtitle: "The Inspiration landscape Design Package",
    price: "$2,000.00",
    hours: "Approximately 10 Hour Job",
    radius: "Within 30km radius from Lennox Head",
    image: "/assets/pricing/package-3.jpg",
    alt: "Inspiration landscape design mood board",
    intro: [
      "You are willing to do all the hard work but you;re just lacking a bit of imagination. Getting overwhelmed with how to get started and need a plan?",
      "Our Balga Inspiration Package will help with budget, hard landscaping layout and materials selection, plant selection and recommend contractors – for anywhere in your garden that is a priority.",
      "At the end of this process, you will have the confidence to move forward and design your own landscape, including creating a base plan on which to develop your design.",
    ],
    includedIntro: "What’s included:",
    included: [
      "Onsite Assessment – in person consultation and site assessment;",
      "Advice writing – Step by step plan for you to follow;",
      "Mood-Board – presentation with a sketch design, photos and inspirational images for your guidance;",
      "Plants & Materials list;",
      "Recommended Contractors – Recommend contractors to bring the design to life.",
    ],
    notes: [
      "* Please note no drawings are provided within this service.",
      "** In case you would like some assistance with the planting or getting plants from our awesome suppliers, an additional hourly rate applies.",
    ],
  },
  {
    number: 4,
    title: "Package 4 – The Complete Design Package",
    subtitle: "The homeowners Design Package",
    price: "$4,500.00",
    hours: "Approximately 30 Hour Job",
    radius: "Within 30km radios from Lennox Head",
    image: "/assets/pricing/package-4.jpg",
    alt: "Complete landscape design package",
    intro: [
      "The Complete Design Package is designed for clients who have recently built their new home or want to redesign their existing outdoor area.",
      "This package would suit a new homeowner or clients who want to establish a garden that complements their newly built or renovated home.",
      "This can be completed in stages, as required.",
    ],
    includedIntro: "What’s included:",
    included: [
      "Onsite Assessment – We’ll meet on-site, measure up, and get a feel for your space;",
      "Landscape Design – concept design plan;",
      "Mood-board presentation;",
      "Recommended Contractors – Recommend contractors to bring the design to life;",
      "Refinement round – Evaluation of the project to ensure the design meets your needs;",
      "Preparation and installation of the soft scape;",
      "Follow up appointment – after the landscape project has been completed, to ensure the new garden meets your needs and discuss further considerations.",
    ],
    notes: [
      "*Steep/complex sites or additional areas may require additional fees – To be discussed at first meeting. ** Please note this package is intended for 3 different garden sections, and price may vary for additional sections of the total outdoor area.",
    ],
  },
];
