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
 * Projects to show against a service.
 *
 * Keeps the ones the client picked, silently drops any that have since been
 * deleted or hidden, and tops the list up from the remaining projects so the
 * section never empties out or shows work that isn't on the site any more.
 */
export const relatedProjectsFor = (ids: string[] = [], count = 2): Project[] => {
  const picked = ids.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p);
  const fill = projects.filter((p) => !picked.some((q) => q.id === p.id));
  return [...picked, ...fill].slice(0, Math.max(count, picked.length));
};

