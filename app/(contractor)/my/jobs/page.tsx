import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ListFilters } from "@/components/ListFilters";
import { formatDate } from "@/lib/format";
import { requireContractor } from "@/lib/contractor";
import type { JobStatus } from "@prisma/client";

const STATUS_VALUES = [
  "ENQUIRY",
  "QUOTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default async function ContractorJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { contractorId } = await requireContractor();
  const { status, q } = await searchParams;
  const statusFilter = STATUS_VALUES.includes(status ?? "")
    ? (status as JobStatus)
    : undefined;

  const jobs = await prisma.job.findMany({
    where: {
      contractors: { some: { id: contractorId } },
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    include: { client: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="My jobs" subtitle="Every job you're assigned to." />

      <ListFilters
        searchPlaceholder="Search job title…"
        filters={[
          {
            name: "status",
            options: [
              { value: "", label: "All statuses" },
              ...STATUS_VALUES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
            ],
          },
        ]}
      />

      {jobs.length === 0 ? (
        <EmptyState message="No jobs found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/my/jobs/${j.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {j.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{j.client.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={j.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(j.scheduledDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
