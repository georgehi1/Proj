// Pure, day-level availability logic. Works on `yyyy-MM-dd` strings so the same
// code runs on the server and in the job form (lexical order == date order for
// ISO dates, so range checks are plain string comparisons).

export type AvailabilityKind = "AVAILABLE" | "TIME_OFF";

export type AvailabilityWindow = {
  kind: AvailabilityKind;
  start: string; // yyyy-MM-dd, inclusive
  end: string; // yyyy-MM-dd, inclusive
};

// "off"      → time off covers the day (overrides availability)
// "unmarked" → no availability window declared for the day
// "busy"     → available, but already assigned to another job that day
// "free"     → available and not double-booked
export type DayStatus = "off" | "unmarked" | "busy" | "free";

export function dayStatus(
  windows: AvailabilityWindow[],
  bookedDates: string[],
  date: string
): DayStatus {
  const covers = (w: AvailabilityWindow) => w.start <= date && date <= w.end;
  if (windows.some((w) => w.kind === "TIME_OFF" && covers(w))) return "off";
  if (!windows.some((w) => w.kind === "AVAILABLE" && covers(w))) return "unmarked";
  if (bookedDates.includes(date)) return "busy";
  return "free";
}

export const STATUS_LABEL: Record<DayStatus, string> = {
  free: "Free",
  busy: "Booked that day",
  off: "Time off",
  unmarked: "No availability set",
};

// Tailwind classes for the status pill (literal so they survive the build).
export const STATUS_CLASS: Record<DayStatus, string> = {
  free: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-800",
  off: "bg-red-100 text-red-700",
  unmarked: "bg-slate-100 text-slate-500",
};
