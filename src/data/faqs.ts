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

// FAQs are edited in the CMS (one JSON file per question) and reflect on every
// page that shows them (the FAQ page + the Pricing/Projects subsets).
type FaqFile = FAQ & { order?: number };
const modules = import.meta.glob<FaqFile>("./faqs/*.json", { eager: true, import: "default" });

export const faqs: FAQ[] = Object.entries(modules)
  .map(([path, data]) => ({ path, ...(data as FaqFile) }))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(({ path, order, ...f }) => f as FAQ);

/** FAQs filtered to one or more categories (for curated sections on other pages). */
export const faqsByCategory = (cats: string[]): FAQ[] =>
  faqs.filter((f) => cats.includes(f.category));
