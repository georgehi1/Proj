"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CalendarView } from "@/lib/calendar";
import { updateJobSchedule } from "../jobs/actions";

export type CalendarJob = {
  id: string;
  title: string;
  clientName: string;
  contractorDots: string[];
  contractorNames: string[];
};

export type CalendarDay = {
  key: string; // yyyy-MM-dd
  label: string; // day number
  inMonth: boolean;
  isToday: boolean;
  weekday: string; // Mon, Tue…
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Chip({
  job,
  onDragStart,
}: {
  job: CalendarJob;
  onDragStart: (id: string) => void;
}) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", job.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(job.id);
      }}
      title={`${job.title} — ${job.clientName}${
        job.contractorNames.length ? ` · ${job.contractorNames.join(", ")}` : ""
      }`}
      className="block cursor-grab rounded bg-slate-50 px-1.5 py-1 text-xs text-slate-700 hover:bg-slate-100 active:cursor-grabbing"
    >
      <span className="flex items-center gap-1">
        {job.contractorDots.length > 0 ? (
          job.contractorDots.map((c, i) => (
            <span key={i} className={`h-2 w-2 shrink-0 rounded-full ${c}`} />
          ))
        ) : (
          <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
        )}
        <span className="truncate">{job.title}</span>
      </span>
    </Link>
  );
}

export function CalendarBoard({
  view,
  days,
  jobsByDay,
  unscheduled,
}: {
  view: CalendarView;
  days: CalendarDay[];
  jobsByDay: Record<string, CalendarJob[]>;
  unscheduled: CalendarJob[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function reschedule(jobId: string, isoDate: string | null) {
    startTransition(async () => {
      await updateJobSchedule(jobId, isoDate);
      router.refresh();
    });
  }

  function dropHandlers(targetKey: string | null) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(targetKey ?? "__unscheduled__");
      },
      onDragLeave: () => setOver(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("text/plain") || dragging;
        setOver(null);
        setDragging(null);
        if (jobId) reschedule(jobId, targetKey);
      },
    };
  }

  const gridCols = view === "day" ? "grid-cols-1" : "grid-cols-7";
  const minH = view === "month" ? "min-h-28" : "min-h-[60vh]";

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-70" : ""} lg:flex-row`}>
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {view !== "day" && (
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
        )}
        <div className={`grid ${gridCols}`}>
          {days.map((day) => {
            const dayJobs = jobsByDay[day.key] ?? [];
            const isOver = over === day.key;
            return (
              <div
                key={day.key}
                {...dropHandlers(day.key)}
                className={`${minH} border-b border-r border-slate-100 p-1.5 ${
                  day.inMonth ? "bg-white" : "bg-slate-50/60"
                } ${isOver ? "ring-2 ring-inset ring-brand-400" : ""}`}
              >
                <div className="mb-1 flex items-center gap-2">
                  {view === "day" && (
                    <span className="text-xs font-medium text-slate-400">{day.weekday}</span>
                  )}
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      day.isToday
                        ? "bg-brand-600 font-semibold text-white"
                        : day.inMonth
                          ? "text-slate-600"
                          : "text-slate-300"
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayJobs.map((job) => (
                    <Chip key={job.id} job={job} onDragStart={setDragging} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside
        {...dropHandlers(null)}
        className={`w-full shrink-0 rounded-xl border border-slate-200 bg-white p-3 lg:w-64 ${
          over === "__unscheduled__" ? "ring-2 ring-inset ring-brand-400" : ""
        }`}
      >
        <h3 className="mb-2 px-1 text-sm font-semibold text-slate-800">
          Unscheduled ({unscheduled.length})
        </h3>
        <p className="mb-3 px-1 text-xs text-slate-400">
          Drag onto a day to schedule. Drag a job here to clear its date.
        </p>
        <div className="space-y-1">
          {unscheduled.map((job) => (
            <Chip key={job.id} job={job} onDragStart={setDragging} />
          ))}
        </div>
      </aside>
    </div>
  );
}
