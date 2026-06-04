import type { MaterialStatus } from "@prisma/client";

// One material line that still needs buying/collecting for a day's jobs.
// (Status is never RECEIVED here — those are already present.)
export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitCost: number | null;
  supplier: string | null;
  sku: string | null;
  sourceUrl: string | null;
  status: MaterialStatus; // NEEDED or ORDERED
  jobId: string;
  jobRef: number;
  jobTitle: string;
  clientName: string;
};

export type ShoppingGroup = {
  supplier: string; // display label; null suppliers become "Unspecified supplier"
  items: ShoppingItem[];
  subtotal: number; // sum of known line totals
};

export type ShoppingList = {
  groups: ShoppingGroup[];
  itemCount: number;
  total: number; // estimated, from known unit costs only
};

const NO_SUPPLIER = "Unspecified supplier";

export function lineTotal(item: Pick<ShoppingItem, "quantity" | "unitCost">): number {
  return item.unitCost == null ? 0 : item.quantity * item.unitCost;
}

/**
 * Group outstanding materials into a shopping list: one section per supplier
 * (so each merchant run is self-contained), items sorted by name, suppliers
 * sorted alphabetically with "Unspecified supplier" always last. Pure — all
 * I/O (querying, date windows) lives in the page.
 */
export function buildShoppingList(items: ShoppingItem[]): ShoppingList {
  const bySupplier = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const key = item.supplier?.trim() || NO_SUPPLIER;
    (bySupplier.get(key) ?? bySupplier.set(key, []).get(key)!).push(item);
  }

  const groups: ShoppingGroup[] = [...bySupplier.entries()]
    .map(([supplier, groupItems]) => ({
      supplier,
      items: [...groupItems].sort((a, b) => a.name.localeCompare(b.name)),
      subtotal: groupItems.reduce((sum, i) => sum + lineTotal(i), 0),
    }))
    .sort((a, b) => {
      if (a.supplier === NO_SUPPLIER) return 1;
      if (b.supplier === NO_SUPPLIER) return -1;
      return a.supplier.localeCompare(b.supplier);
    });

  return {
    groups,
    itemCount: items.length,
    total: groups.reduce((sum, g) => sum + g.subtotal, 0),
  };
}
