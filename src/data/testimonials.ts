export interface Testimonial {
  quote: string;
  author?: string;
  role?: string;
}

// Edited in the CMS (one JSON file per testimonial); shown by the testimonial
// slider on every page that uses it.
type TestimonialFile = Testimonial & { order?: number };
const modules = import.meta.glob<TestimonialFile>("./testimonials/*.json", { eager: true, import: "default" });

export const testimonials: Testimonial[] = Object.entries(modules)
  .map(([path, data]) => ({ path, ...(data as TestimonialFile) }))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(({ path, order, ...t }) => t as Testimonial);
