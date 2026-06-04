import type { SupplierProvider, SupplierResult } from "./types";
import { screwfixSearchUrl } from "./catalogue";

// Live prices via an Apify "Screwfix scraper" actor, called with YOUR token.
// Configure:
//   APIFY_TOKEN           – your Apify API token
//   APIFY_SCREWFIX_ACTOR  – actor id, e.g. "studio-amba~screwfix-scraper"
//                           (use the "owner~actor" form Apify expects in URLs)
// Actor output shapes differ, so normalise() reads several likely field names.
// Verify the mapping against a real run for the actor you choose.

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = process.env.APIFY_SCREWFIX_ACTOR;
const TIMEOUT_MS = Number(process.env.APIFY_TIMEOUT_MS) || 25_000;

export const apifyConfigured = Boolean(APIFY_TOKEN && APIFY_ACTOR);

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  if (v && typeof v === "object" && "value" in v) return toNumber((v as { value: unknown }).value);
  return null;
}

function toStock(item: Record<string, unknown>): boolean | null {
  if (typeof item.inStock === "boolean") return item.inStock;
  const avail = item.availability ?? item.stockStatus ?? item.stock;
  if (typeof avail === "string") {
    if (/out of stock|unavailable/i.test(avail)) return false;
    if (/in stock|available/i.test(avail)) return true;
  }
  if (typeof avail === "number") return avail > 0;
  return null;
}

function normalise(raw: unknown): SupplierResult | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const name = (item.name ?? item.title ?? item.productName) as string | undefined;
  if (!name) return null;
  const url = (item.url ?? item.link ?? item.productUrl) as string | undefined;
  return {
    sku: (item.sku ?? item.code ?? item.id ?? null) as string | null,
    name,
    price: toNumber(item.price ?? item.priceIncVat ?? item.currentPrice ?? item.priceVat),
    url: url ?? screwfixSearchUrl(name),
    inStock: toStock(item),
    supplier: "Screwfix",
  };
}

export const apifyProvider: SupplierProvider = {
  id: "apify",
  async search(query: string, limit: number): Promise<SupplierResult[]> {
    if (!apifyConfigured) throw new Error("Apify provider is not configured");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ search: query, query, maxItems: limit }),
          signal: controller.signal,
        }
      );
      if (!res.ok) {
        throw new Error(`Apify run failed (${res.status})`);
      }
      const items = (await res.json()) as unknown[];
      return items
        .map(normalise)
        .filter((r): r is SupplierResult => r !== null)
        .slice(0, limit);
    } finally {
      clearTimeout(timer);
    }
  },
};
