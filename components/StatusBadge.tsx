import { humanize } from "@/lib/format";

const jobColors: Record<string, string> = {
  ENQUIRY: "bg-slate-100 text-slate-700",
  QUOTED: "bg-amber-100 text-amber-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-brand-100 text-brand-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const invoiceColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-violet-100 text-violet-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-500 line-through",
};

const typeColors: Record<string, string> = {
  RESIDENTIAL: "bg-teal-100 text-teal-800",
  COMMERCIAL: "bg-indigo-100 text-indigo-800",
  QUOTE: "bg-amber-100 text-amber-800",
  INVOICE: "bg-brand-100 text-brand-800",
};

const palettes = { ...jobColors, ...invoiceColors, ...typeColors };

export function StatusBadge({ value }: { value: string }) {
  const color = palettes[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {humanize(value)}
    </span>
  );
}
