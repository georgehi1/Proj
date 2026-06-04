// A normalised search result from any material supplier source.
export type SupplierResult = {
  sku: string | null;
  name: string;
  price: number | null; // GBP, inc VAT where known
  url: string | null; // buy link
  supplier: string; // e.g. "Screwfix"
};

export type SupplierSearch = {
  results: SupplierResult[];
  // true when results came from a live price source, false for the
  // curated-catalogue fallback. Lets the UI flag prices as indicative.
  live: boolean;
};

export interface SupplierProvider {
  readonly id: string;
  search(query: string, limit: number): Promise<SupplierResult[]>;
}
