import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

function Step({
  done,
  title,
  description,
  href,
  cta,
}: {
  done: boolean;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-green-100 text-green-700" : "border border-slate-300 text-slate-400"
        }`}
        aria-hidden
      >
        {done ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>
          {title}
        </span>
        <span className="text-xs text-slate-400">{description}</span>
      </span>
      {!done && (
        <Link href={href} className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
          {cta}
        </Link>
      )}
    </li>
  );
}

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
  const [inProgress, enquiries, unpaid, upcomingJobs, clientCount, jobCount, invoiceCount] =
    await Promise.all([
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
      prisma.client.count(),
      prisma.job.count(),
      prisma.invoice.count(),
    ]);

  // First-run guidance: shown until the user has at least one client, job and
  // document, then it disappears for good.
  const setupComplete = clientCount > 0 && jobCount > 0 && invoiceCount > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick overview of what's happening."
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/jobs/new">New job</LinkButton>
            <LinkButton href="/invoices/new" variant="secondary">
              New quote / invoice
            </LinkButton>
            <LinkButton href="/clients/new" variant="secondary">
              New client
            </LinkButton>
          </div>
        }
      />

      {!setupComplete && (
        <Card className="mb-6">
          <CardHeader title="Getting started" />
          <ul className="divide-y divide-slate-100">
            <Step
              done={clientCount > 0}
              title="Add a client"
              description="The person or business you're doing the work for."
              href="/clients/new"
              cta="Add client"
            />
            <Step
              done={jobCount > 0}
              title="Create a job"
              description="Track the work and assign contractors."
              href="/jobs/new"
              cta="Create job"
            />
            <Step
              done={invoiceCount > 0}
              title="Send a quote or invoice"
              description="Add line items and VAT, then export a PDF or email it."
              href="/invoices/new"
              cta="Create document"
            />
          </ul>
        </Card>
      )}

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
