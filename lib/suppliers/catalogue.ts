import type { SupplierProvider, SupplierResult } from "./types";

// Deep link to a Screwfix search for a term — always valid, even without a
// live price source. (Affiliate wrapping can be added here later.)
export function screwfixSearchUrl(term: string): string {
  return `https://www.screwfix.com/search?search=${encodeURIComponent(term)}`;
}

// A small curated list of materials a property-maintenance firm reaches for
// often. Prices are indicative (set/maintained in-house) — not live. Extend
// freely; this is the offline fallback when no live provider is configured.
type CatalogueItem = { name: string; price: number; unit?: string; keywords?: string[] };

const CATALOGUE: CatalogueItem[] = [
  { name: "Copper pipe 15mm x 3m", price: 11.99, unit: "length", keywords: ["copper", "pipe", "plumbing"] },
  { name: "Copper pipe 22mm x 3m", price: 19.49, unit: "length", keywords: ["copper", "pipe", "plumbing"] },
  { name: "15mm push-fit straight coupler", price: 1.49, keywords: ["pushfit", "fitting", "coupler", "plumbing"] },
  { name: "PTFE thread seal tape 12m", price: 0.99, keywords: ["ptfe", "tape", "plumbing"] },
  { name: "Twin & earth cable 2.5mm² x 10m", price: 14.99, unit: "coil", keywords: ["cable", "electrical", "twin earth"] },
  { name: "Twin & earth cable 1.5mm² x 10m", price: 9.99, unit: "coil", keywords: ["cable", "electrical", "twin earth", "lighting"] },
  { name: "13A double socket white", price: 3.29, keywords: ["socket", "electrical", "plug"] },
  { name: "MK 6A single light switch", price: 4.49, keywords: ["switch", "electrical", "lighting"] },
  { name: "Plasterboard 12.5mm 2400 x 1200mm", price: 9.98, unit: "sheet", keywords: ["plasterboard", "drywall", "board"] },
  { name: "Multi-finish plaster 25kg", price: 12.49, unit: "bag", keywords: ["plaster", "skim"] },
  { name: "Bonding coat plaster 25kg", price: 11.29, unit: "bag", keywords: ["plaster", "bonding"] },
  { name: "Sand & cement mortar 20kg", price: 5.49, unit: "bag", keywords: ["cement", "mortar", "sand"] },
  { name: "Silicone sealant white 310ml", price: 4.29, keywords: ["silicone", "sealant", "caulk"] },
  { name: "Decorator's caulk white 380ml", price: 1.99, keywords: ["caulk", "sealant", "decorating"] },
  { name: "Multipurpose screws 4x40mm (200pk)", price: 6.99, unit: "box", keywords: ["screws", "fixings"] },
  { name: "Wall plugs brown (100pk)", price: 2.49, unit: "pack", keywords: ["wall plugs", "fixings", "rawlplug"] },
  { name: "Matt emulsion paint white 10L", price: 18.99, unit: "tub", keywords: ["paint", "emulsion", "decorating"] },
  { name: "Gloss paint white 750ml", price: 12.99, unit: "tin", keywords: ["paint", "gloss", "decorating"] },
  { name: "Expanding foam 500ml", price: 5.99, keywords: ["foam", "expanding", "filler"] },
  { name: "Radiator valve chrome 15mm (pair)", price: 8.99, keywords: ["radiator", "valve", "heating", "plumbing"] },
];

function matches(item: CatalogueItem, terms: string[]): boolean {
  const hay = `${item.name} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export const catalogueProvider: SupplierProvider = {
  id: "catalogue",
  async search(query: string, limit: number): Promise<SupplierResult[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return CATALOGUE.filter((item) => matches(item, terms))
      .slice(0, limit)
      .map((item) => ({
        sku: null,
        name: item.name,
        price: item.price,
        url: screwfixSearchUrl(item.name),
        supplier: "Screwfix",
      }));
  },
};
