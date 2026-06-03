import {
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/db";
import { LinkButton, PageHeader } from "@/components/ui";
import { ListFilters } from "@/components/ListFilters";
import {
  calendarRange,
  getReferenceDate,
  isCalendarView,
  contractorColor,
  type CalendarView,
} from "@/lib/calendar";
import { CalendarBoard, type CalendarDay, type CalendarJob } from "./CalendarBoard";

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; contractor?: string }>;
}) {
  const { view: viewParam, date, contractor } = await searchParams;
  const view: CalendarView = isCalendarView(viewParam) ? viewParam : "month";
  const reference = getReferenceDate(date);
  const { gridStart, gridEnd, days } = calendarRange(view, reference);

  const contractors = await prisma.contractor.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const colorOf = new Map(contractors.map((c, i) => [c.id, contractorColor(i)]));
  const contractorWhere = contractor
    ? { contractors: { some: { id: contractor } } }
    : {};

  const [scheduled, unscheduledJobs] = await Promise.all([
    prisma.job.findMany({
      where: {
        scheduledDate: { gte: gridStart, lte: gridEnd },
        ...contractorWhere,
      },
      orderBy: { scheduledDate: "asc" },
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        client: { select: { name: true } },
        contractors: { select: { id: true, name: true } },
      },
    }),
    prisma.job.findMany({
      where: {
        scheduledDate: null,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        ...contractorWhere,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        client: { select: { name: true } },
        contractors: { select: { id: true, name: true } },
      },
    }),
  ]);

  const toChip = (j: {
    id: string;
    title: string;
    client: { name: string };
    contractors: { id: string; name: string }[];
  }): CalendarJob => ({
    id: j.id,
    title: j.title,
    clientName: j.client.name,
    contractorDots: j.contractors.map((c) => colorOf.get(c.id) ?? "bg-slate-300"),
    contractorNames: j.contractors.map((c) => c.name),
  });

  const jobsByDay: Record<string, CalendarJob[]> = {};
  for (const j of scheduled) {
    if (!j.scheduledDate) continue;
    const key = dayKey(j.scheduledDate);
    (jobsByDay[key] ??= []).push(toChip(j));
  }

  const calendarDays: CalendarDay[] = days.map((d) => ({
    key: dayKey(d),
    label: format(d, "d"),
    weekday: format(d, "EEE"),
    inMonth: view === "month" ? isSameMonth(d, reference) : true,
    isToday: isToday(d),
  }));

  // Navigation (preserve the contractor filter).
  const step = (dir: -1 | 1) => {
    const fn =
      view === "month"
        ? dir === 1
          ? addMonths
          : subMonths
        : view === "week"
          ? dir === 1
            ? addWeeks
            : subWeeks
          : dir === 1
            ? addDays
            : subDays;
    return format(fn(reference, 1), "yyyy-MM-dd");
  };
  const q = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    if (contractor) sp.set("contractor", contractor);
    return `/calendar?${sp.toString()}`;
  };

  const title =
    view === "month"
      ? format(reference, "MMMM yyyy")
      : view === "week"
        ? `${format(gridStart, "d MMM")} – ${format(gridEnd, "d MMM yyyy")}`
        : format(reference, "EEEE d MMM yyyy");

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Jobs by scheduled date — drag to reschedule."
        action={
          <div className="flex items-center gap-2">
            <LinkButton href={q({ view, date: step(-1) })} variant="secondary">
              ‹
            </LinkButton>
            <LinkButton href={q({ view })} variant="secondary">
              Today
            </LinkButton>
            <LinkButton href={q({ view, date: step(1) })} variant="secondary">
              ›
            </LinkButton>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm">
            {(["month", "week", "day"] as const).map((v) => (
              <a
                key={v}
                href={q({ view: v, date: format(reference, "yyyy-MM-dd") })}
                className={`px-3 py-1.5 capitalize ${
                  v === view ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {v}
              </a>
            ))}
          </div>
        </div>
        <ListFilters
          filters={[
            {
              name: "contractor",
              options: [
                { value: "", label: "All contractors" },
                ...contractors.map((c) => ({ value: c.id, label: c.name })),
              ],
            },
          ]}
        />
      </div>

      {contractors.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {contractors.map((c, i) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${contractorColor(i)}`} />
              {c.name}
            </span>
          ))}
        </div>
      )}

      <CalendarBoard
        view={view}
        days={calendarDays}
        jobsByDay={jobsByDay}
        unscheduled={unscheduledJobs.map(toChip)}
      />
    </div>
  );
}
