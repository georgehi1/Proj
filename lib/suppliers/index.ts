import type { SupplierSearch } from "./types";
import { catalogueProvider } from "./catalogue";
import { apifyProvider, apifyConfigured } from "./apify";

export type { SupplierResult, SupplierSearch } from "./types";
export { screwfixSearchUrl } from "./catalogue";
export { apifyConfigured } from "./apify";

/**
 * Search materials across the configured supplier source. Uses the live
 * (Apify) provider when configured, and falls back to the curated catalogue
 * if it isn't, errors, or returns nothing — so search always returns results.
 */
export async function searchMaterials(query: string, limit = 12): Promise<SupplierSearch> {
  const q = query.trim();
  if (!q) return { results: [], live: false };

  if (apifyConfigured) {
    try {
      const results = await apifyProvider.search(q, limit);
      if (results.length > 0) return { results, live: true };
    } catch (e) {
      console.warn(`[suppliers] live search failed, using catalogue: ${(e as Error).message}`);
    }
  }

  const results = await catalogueProvider.search(q, limit);
  return { results, live: false };
}
