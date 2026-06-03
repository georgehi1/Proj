export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Compute line totals plus invoice subtotal / VAT / grand total. */
export function computeTotals(items: LineItemInput[], vatRate: number) {
  const lines = items.map((i) => ({
    ...i,
    lineTotal: round2(i.quantity * i.unitPrice),
  }));
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const vatAmount = round2((subtotal * vatRate) / 100);
  const total = round2(subtotal + vatAmount);
  return { lines, subtotal, vatAmount, total };
}
