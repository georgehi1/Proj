import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  parse,
  isValid,
} from "date-fns";
import { prisma } from "@/lib/db";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import type { JobStatus } from "@prisma/client";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusDot: Record<JobStatus, string> = {
  ENQUIRY: "bg-slate-400",
  QUOTED: "bg-amber-500",
  SCHEDULED: "bg-blue-500",
  IN_PROGRESS: "bg-brand-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-400",
};

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const parsed = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const reference = isValid(parsed) ? parsed : new Date();

  const gridStart = startOfWeek(startOfMonth(reference), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(reference), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const jobs = await prisma.job.findMany({
    where: { scheduledDate: { gte: gridStart, lte: gridEnd } },
    orderBy: { scheduledDate: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      scheduledDate: true,
      client: { select: { name: true } },
    },
  });

  const jobsByDay = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.scheduledDate) continue;
    const key = dayKey(job.scheduledDate);
    const list = jobsByDay.get(key) ?? [];
    list.push(job);
    jobsByDay.set(key, list);
  }

  const prevMonth = format(subMonths(reference, 1), "yyyy-MM");
  const nextMonth = format(addMonths(reference, 1), "yyyy-MM");

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Jobs by their scheduled date."
        action={
          <div className="flex items-center gap-2">
            <LinkButton href={`/calendar?month=${prevMonth}`} variant="secondary">
              ‹ Prev
            </LinkButton>
            <LinkButton href="/calendar" variant="secondary">
              Today
            </LinkButton>
            <LinkButton href={`/calendar?month=${nextMonth}`} variant="secondary">
              Next ›
            </LinkButton>
          </div>
        }
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-800">
        {format(reference, "MMMM yyyy")}
      </h2>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dayKey(day);
            const dayJobs = jobsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, reference);
            const today = isToday(day);
            return (
              <div
                key={key}
                className={`min-h-28 border-b border-r border-slate-100 p-1.5 ${
                  inMonth ? "bg-white" : "bg-slate-50/60"
                }`}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? "bg-brand-600 font-semibold text-white"
                      : inMonth
                        ? "text-slate-600"
                        : "text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      title={`${job.title} — ${job.client.name}`}
                      className="flex items-center gap-1.5 rounded bg-slate-50 px-1.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot[job.status]}`} />
                      <span className="truncate">{job.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
