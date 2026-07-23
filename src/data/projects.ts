export interface Project {
  id: string;
  title: string;
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  location?: string;
  service?: string;
  date?: string;
  description?: string;
}

// Seven before/after pairs, in the order shown on /projects/.
export const projects: Project[] = [
  {
    id: "project-01",
    title: "Kingsley Project: A Benchmark in Sustainable Landscaping Design",
    before: "/assets/projects/project-01/before.jpg",
    after: "/assets/projects/project-01/after.jpg",
    beforeAlt: "Kingsley project site before landscaping",
    afterAlt: "Kingsley project after sustainable landscaping",
    location: "Northern Rivers",
    service: "Gardening",
    date: "10-08-2024",
    description:
      "The Kingsley Project in Byron Bay, NSW sets a new benchmark for sustainable and contemporary landscaping design. Explore how this innovative project seamlessly integrates eco-friendly elements with modern aesthetics to create a harmonious living space that perfectly complements its surroundings.",
  },
  {
    id: "project-02",
    title: "Bangalow Backyard Transformation",
    before: "/assets/projects/project-02/before.jpg",
    after: "/assets/projects/project-02/after.jpeg",
    beforeAlt: "Bangalow backyard before transformation",
    afterAlt: "Bangalow backyard after transformation",
    location: "Northern Rivers",
    service: "Gardening",
    date: "10-08-2024",
    description:
      "Through meticulous planning and execution, we transformed this Bangalow backyard outdoor space into a breathtaking oasis that harmonises with the area’s natural beauty.",
  },
  {
    id: "project-03",
    title: "Native Garden Renewal",
    before: "/assets/projects/project-03/before.jpg",
    after: "/assets/projects/project-03/after.jpg",
    beforeAlt: "Garden before native planting renewal",
    afterAlt: "Garden after native planting renewal",
  },
  {
    id: "project-04",
    title: "Coastal Courtyard Makeover",
    before: "/assets/projects/project-04/before.jpg",
    after: "/assets/projects/project-04/after.jpeg",
    beforeAlt: "Coastal courtyard before makeover",
    afterAlt: "Coastal courtyard after makeover",
  },
  {
    id: "project-05",
    title: "Sloping Block Revival",
    before: "/assets/projects/project-05/before.jpeg",
    after: "/assets/projects/project-05/after.jpeg",
    beforeAlt: "Sloping block before revival",
    afterAlt: "Sloping block after revival",
  },
  {
    id: "project-06",
    title: "Front Garden Refresh",
    before: "/assets/projects/project-06/before.jpeg",
    after: "/assets/projects/project-06/after.jpeg",
    beforeAlt: "Front garden before refresh",
    afterAlt: "Front garden after refresh",
  },
  {
    id: "project-07",
    title: "Regenerative Landscape",
    before: "/assets/projects/project-07/before.jpg",
    after: "/assets/projects/project-07/after.jpg",
    beforeAlt: "Regenerative landscape before works",
    afterAlt: "Regenerative landscape after works",
  },
];

// Home / Services projects-preview trio.
export const projectsPreview: Project[] = [
  {
    id: "preview-01",
    title: "Backyard Transformation",
    before: "/assets/projects/project-02/before.jpg",
    after: "/assets/projects/project-02/after.jpeg",
    beforeAlt: "Backyard before transformation",
    afterAlt: "Backyard after transformation",
  },
  {
    id: "preview-02",
    title: "Native Garden Renewal",
    before: "/assets/projects/project-03/before.jpg",
    after: "/assets/projects/preview-01-after.jpeg",
    beforeAlt: "Garden before native renewal",
    afterAlt: "Garden after native renewal",
  },
  {
    id: "preview-03",
    title: "Courtyard Makeover",
    before: "/assets/projects/project-04/before.jpg",
    after: "/assets/projects/project-04/after.jpeg",
    beforeAlt: "Courtyard before makeover",
    afterAlt: "Courtyard after makeover",
  },
];
