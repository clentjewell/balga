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
  /** Slugs of the services this project is an example of (CMS checkboxes). */
  services?: string[];
  /** Hidden from the website without deleting it (CMS checkbox). */
  draft?: boolean;
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
  // A hidden project drops out of every list on the site at once.
  .filter((p) => !p.draft)
  .sort((a, b) => {
    const oa = (modules[`./projects/${a.id}.json`] as ProjectFile)?.order ?? 0;
    const ob = (modules[`./projects/${b.id}.json`] as ProjectFile)?.order ?? 0;
    return oa - ob;
  });

/**
 * The trio shown on the home and services pages.
 *
 * Derived from the client's own projects rather than a fixed list: when they add,
 * remove or hide a project in the CMS, these follow. (They used to be hard-coded,
 * so deleting a project left its photos on both pages — the image files stay in
 * the repo even after the project itself is gone.)
 */
export const projectsPreview: Project[] = projects.slice(0, 3);

/**
 * The projects tagged as examples of one service.
 *
 * Tagging lives on the project ("which services is this an example of?"), so adding
 * a project puts it on the right service pages in one step and removing it takes it
 * off them. A service with no tagged projects hides its project section rather than
 * showing something unrelated.
 */
export const projectsForService = (slug: string): Project[] =>
  projects.filter((p) => (p.services ?? []).includes(slug));

