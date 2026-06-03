import { format } from "date-fns";

type Numeric = number | string | { toString(): string } | null | undefined;

/** Coerce a Prisma Decimal / string / number into a JS number. */
export function toNumber(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatCurrency(value: Numeric): string {
  return gbp.format(toNumber(value));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy");
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy, HH:mm");
}

/** Turn an ENUM_VALUE into a "Enum value" label. */
export function humanize(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
