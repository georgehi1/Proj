import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { requireContractor } from "@/lib/contractor";

const OPEN_STATUSES = ["SCHEDULED", "IN_PROGRESS"] as const;

export default async function ContractorDashboard() {
  const { user, contractorId } = await requireContractor();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const mine = { contractors: { some: { id: contractorId } } };

  const [openCount, todayJobs, upcomingJobs] = await Promise.all([
    prisma.job.count({
      where: { ...mine, status: { in: [...OPEN_STATUSES] } },
    }),
    prisma.job.findMany({
      where: {
        ...mine,
        scheduledDate: { gte: startOfToday, lt: startOfTomorrow },
      },
      orderBy: { scheduledDate: "asc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.job.findMany({
      where: {
        ...mine,
        scheduledDate: { gte: startOfTomorrow },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { scheduledDate: "asc" },
      take: 8,
      include: { client: { select: { name: true } } },
    }),
  ]);

  const firstName = (user.name ?? "").split(" ")[0] || "there";

  return (
    <div>
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle="Your jobs and schedule at a glance."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Open jobs</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{openCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">On site today</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{todayJobs.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Today" />
          {todayJobs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Nothing scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/my/jobs/${j.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-sm text-slate-700">{j.title}</span>
                      <span className="text-xs text-slate-400">{j.client.name}</span>
                    </span>
                    <StatusBadge value={j.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming" />
          {upcomingJobs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No upcoming scheduled jobs.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/my/jobs/${j.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-sm text-slate-700">{j.title}</span>
                      <span className="text-xs text-slate-400">{j.client.name}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{formatDate(j.scheduledDate)}</span>
                      <StatusBadge value={j.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
