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

// Projects are stored as one JSON file per project in ./projects/ so the CMS can
// add / edit / delete them. Astro loads them all at build via import.meta.glob.
type ProjectFile = Omit<Project, "id"> & { order?: number };
const modules = import.meta.glob<ProjectFile>("./projects/*.json", { eager: true, import: "default" });

export const projects: Project[] = Object.entries(modules)
  .map(([path, data]) => {
    const id = path.split("/").pop()!.replace(/\.json$/, "");
    const { order, ...rest } = data as ProjectFile;
    return { id, ...rest } as Project;
  })
  .sort((a, b) => {
    const oa = (modules[`./projects/${a.id}.json`] as ProjectFile)?.order ?? 0;
    const ob = (modules[`./projects/${b.id}.json`] as ProjectFile)?.order ?? 0;
    return oa - ob;
  });

// Home / Services projects-preview trio (curated showcase — not CMS-managed).
export const projectsPreview: Project[] = [
  {
    id: "preview-01",
    title: "Backyard Transformation",
    before: "/assets/projects/project-02/before.webp",
    after: "/assets/projects/project-02/after.webp",
    beforeAlt: "Backyard before transformation",
    afterAlt: "Backyard after transformation",
  },
  {
    id: "preview-02",
    title: "Native Garden Renewal",
    before: "/assets/projects/project-03/before.webp",
    after: "/assets/projects/preview-01-after.webp",
    beforeAlt: "Garden before native renewal",
    afterAlt: "Garden after native renewal",
  },
  {
    id: "preview-03",
    title: "Courtyard Makeover",
    before: "/assets/projects/project-04/before.webp",
    after: "/assets/projects/project-04/after.webp",
    beforeAlt: "Courtyard before makeover",
    afterAlt: "Courtyard after makeover",
  },
];
