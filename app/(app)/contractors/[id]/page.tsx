import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { currentUser, isAdmin } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteContractor } from "../actions";
import { AvailabilityManager } from "./AvailabilityManager";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = isAdmin(await currentUser());
  const contractor = await prisma.contractor.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { client: { select: { id: true, name: true } } },
      },
      availability: {
        orderBy: { startDate: "asc" },
        select: { id: true, kind: true, startDate: true, endDate: true, note: true },
      },
    },
  });
  if (!contractor) notFound();

  const day = (d: Date) => d.toISOString().slice(0, 10);
  const availabilityWindows = contractor.availability.map((w) => ({
    id: w.id,
    kind: w.kind,
    start: day(w.startDate),
    end: day(w.endDate),
    note: w.note,
  }));

  // Workload: upcoming scheduled jobs that aren't finished, soonest first.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOpen = (s: string) => s !== "COMPLETED" && s !== "CANCELLED";
  const upcoming = contractor.jobs
    .filter((j) => j.scheduledDate && j.scheduledDate >= today && isOpen(j.status))
    .sort((a, b) => a.scheduledDate!.getTime() - b.scheduledDate!.getTime());
  const openJobs = contractor.jobs.filter((j) => isOpen(j.status));
  const nextJob = upcoming[0];

  async function onDelete() {
    "use server";
    await deleteContractor(id);
  }

  return (
    <div>
      <PageHeader
        title={contractor.name}
        subtitle={[contractor.trade, contractor.companyName].filter(Boolean).join(" · ") || "Contractor"}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/contractors/${contractor.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            {admin && (
              <ConfirmButton
                action={onDelete}
                confirmMessage={`Delete ${contractor.name}? They'll be removed from any jobs they're on.`}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-4 px-5 py-4 text-sm">
              <div>
                <dt className="text-slate-400">Phone</dt>
                <dd className="text-slate-800">{contractor.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="text-slate-800">{contractor.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Day rate</dt>
                <dd className="text-slate-800">
                  {contractor.dayRate ? formatCurrency(contractor.dayRate) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd className="text-slate-800">{contractor.active ? "Active" : "Inactive"}</dd>
              </div>
              {contractor.notes && (
                <div>
                  <dt className="text-slate-400">Notes</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{contractor.notes}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <Card className="px-5 py-4">
              <p className="text-2xl font-semibold text-slate-800">{openJobs.length}</p>
              <p className="text-xs text-slate-400">Open jobs</p>
            </Card>
            <Card className="px-5 py-4">
              <p className="text-2xl font-semibold text-slate-800">{upcoming.length}</p>
              <p className="text-xs text-slate-400">Scheduled ahead</p>
            </Card>
            <Card className="px-5 py-4">
              <p className="text-2xl font-semibold text-slate-800">
                {nextJob ? formatDate(nextJob.scheduledDate) : "—"}
              </p>
              <p className="text-xs text-slate-400">Next job</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Availability" />
            <AvailabilityManager contractorId={contractor.id} windows={availabilityWindows} />
          </Card>

          <Card>
            <CardHeader title={`Scheduled workload (${upcoming.length})`} />
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">
                No upcoming scheduled jobs.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((j) => (
                  <li key={j.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="w-28 shrink-0 font-medium text-slate-700">
                      {formatDate(j.scheduledDate)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${j.id}`} className="text-brand-700 hover:underline">
                        {j.title}
                      </Link>
                      <span className="ml-2 text-slate-400">{j.client.name}</span>
                    </div>
                    <StatusBadge value={j.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={`Job history (${contractor.jobs.length})`} />
            {contractor.jobs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">
                Not assigned to any jobs yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-2 font-medium">Job</th>
                    <th className="px-5 py-2 font-medium">Client</th>
                    <th className="px-5 py-2 font-medium">Scheduled</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractor.jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/jobs/${j.id}`} className="text-brand-700 hover:underline">
                          {j.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <Link href={`/clients/${j.client.id}`} className="hover:underline">
                          {j.client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(j.scheduledDate)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge value={j.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
