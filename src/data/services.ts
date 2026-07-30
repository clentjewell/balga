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
  /** ids of related projects (see src/data/projects) to showcase; empty = no section. */
  relatedProjects: string[];
  /** project id whose photo illustrates the two-column content (distinct from hero + related). */
  contentProject: string;
  detail: ServiceDetail;
}

// One JSON file per service in ./services/ so the CMS can edit them (incl. the
// related-projects picker). Astro loads them at build via import.meta.glob.
type ServiceFile = Service & { order?: number };
const modules = import.meta.glob<ServiceFile>("./services/*.json", { eager: true, import: "default" });

export const services: Service[] = Object.values(modules)
  .map((data) => {
    const { order, ...rest } = data as ServiceFile;
    return rest as Service;
  })
  .sort((a, b) => {
    const oa = (modules[`./services/${a.slug}.json`] as ServiceFile)?.order ?? 0;
    const ob = (modules[`./services/${b.slug}.json`] as ServiceFile)?.order ?? 0;
    return oa - ob;
  });
