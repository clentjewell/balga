export interface Service {
  title: string;
  description: string;
  image: string;
  alt: string;
  width: number;
  height: number;
}

export const services: Service[] = [
  {
    title: "Landscape Design",
    description:
      "Custom designs that blend aesthetic appeal with environmental consciousness.",
    image: "/assets/services/landscape-design.jpg",
    alt: "Detailed landscape design plan for a native Australian garden",
    width: 800,
    height: 750,
  },
  {
    title: "Garden Facelift",
    description:
      "Tailored to harmonise with the natural environment, creating spaces that are both functional and beautiful.",
    image: "/assets/services/garden-facelift.jpeg",
    alt: "Regenerated native garden with grasses overlooking the hills",
    width: 1000,
    height: 750,
  },
  {
    title: "Decorative Plants",
    description:
      "Enhance your space by incorporating potted greenery, bringing an organic and stylish feel to your indoor & outdoor area.",
    image: "/assets/services/decorative-plants.png",
    alt: "Styled decorative potted plants",
    width: 1000,
    height: 989,
  },
  {
    title: "Integrated Pest Management",
    description:
      "Restoring native ecosystems and promoting biodiversity within your garden.",
    image: "/assets/services/pest-management.jpg",
    alt: "Cottage-feel native garden bed supporting biodiversity",
    width: 1000,
    height: 750,
  },
  {
    title: "Weed Control Consultation",
    description:
      "Get expert advice on sustainable methods to manage and prevent weeds without harming your garden's ecosystem.",
    image: "/assets/services/weed-control.jpg",
    alt: "Bio-control weed management in a native landscape",
    width: 1000,
    height: 750,
  },
  {
    title: "Horticulture Consultation",
    description:
      "Expert advice on plant selection, soil health, and sustainable gardening practices.",
    image: "/assets/services/horticulture.png",
    alt: "Established native garden bed",
    width: 1000,
    height: 750,
  },
];
