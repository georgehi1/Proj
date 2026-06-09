import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const [inProgress, enquiries, unpaid, upcomingJobs] = await Promise.all([
    prisma.job.count({ where: { status: "IN_PROGRESS" } }),
    prisma.job.count({ where: { status: "ENQUIRY" } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: true,
      where: { type: "INVOICE", status: { in: ["SENT", "OVERDUE"] } },
    }),
    prisma.job.findMany({
      where: { scheduledDate: { gte: new Date() }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { scheduledDate: "asc" },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick overview of what's happening at Homefix."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Jobs in progress" value={String(inProgress)} href="/jobs?status=IN_PROGRESS" />
        <StatCard label="Open enquiries" value={String(enquiries)} href="/jobs?status=ENQUIRY" />
        <StatCard
          label={`Outstanding (${unpaid._count} unpaid)`}
          value={formatCurrency(unpaid._sum.total ?? 0)}
          href="/invoices?type=INVOICE&status=SENT"
        />
      </div>

      <div>
        <Card>
          <CardHeader title="Upcoming scheduled jobs" />
          {upcomingJobs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
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
