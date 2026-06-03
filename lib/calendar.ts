import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  parse,
  isValid,
} from "date-fns";

export type CalendarView = "month" | "week" | "day";

export function isCalendarView(v: string | undefined): v is CalendarView {
  return v === "month" || v === "week" || v === "day";
}

export function getReferenceDate(dateStr?: string): Date {
  if (dateStr) {
    const d = parse(dateStr, "yyyy-MM-dd", new Date());
    if (isValid(d)) return d;
  }
  return new Date();
}

/** The visible grid for a view: the day buckets plus the DB query bounds. */
export function calendarRange(view: CalendarView, reference: Date) {
  if (view === "day") {
    const start = startOfDay(reference);
    return { gridStart: start, gridEnd: endOfDay(reference), days: [start] };
  }
  if (view === "week") {
    const start = startOfWeek(reference, { weekStartsOn: 1 });
    const end = endOfWeek(reference, { weekStartsOn: 1 });
    return { gridStart: start, gridEnd: end, days: eachDayOfInterval({ start, end }) };
  }
  const start = startOfWeek(startOfMonth(reference), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(reference), { weekStartsOn: 1 });
  return { gridStart: start, gridEnd: end, days: eachDayOfInterval({ start, end }) };
}

// Static Tailwind classes (must be literal so they survive the build).
export const CONTRACTOR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-lime-600",
  "bg-fuchsia-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function contractorColor(index: number): string {
  return CONTRACTOR_COLORS[index % CONTRACTOR_COLORS.length];
}
