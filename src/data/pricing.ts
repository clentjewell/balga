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

// Pricing packages are edited in the CMS (one JSON file per package) and shown
// on the Pricing page in ascending "number" order.
type PackageFile = Package & { id?: string };
const modules = import.meta.glob<PackageFile>("./pricing/*.json", { eager: true, import: "default" });

export const packages: Package[] = Object.values(modules)
  .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
  .map(({ id, ...p }) => p as Package);
