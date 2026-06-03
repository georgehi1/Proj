import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Card,
  CardHeader,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { deleteJob } from "../actions";
import { JobStatusControl } from "./JobStatusControl";
import { JobPhotos } from "./JobPhotos";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      assignedTo: { select: { name: true } },
      invoices: { orderBy: { issueDate: "desc" } },
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, filename: true },
      },
      communications: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!job) notFound();

  async function onDelete() {
    "use server";
    await deleteJob(id);
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`For ${job.client.name}`}
        action={
          <div className="flex items-center gap-2">
            <JobStatusControl jobId={job.id} status={job.status} />
            <LinkButton href={`/jobs/${job.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            <ConfirmButton action={onDelete} confirmMessage={`Delete "${job.title}"?`} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 text-sm">
              <div>
                <dt className="text-slate-400">Client</dt>
                <dd>
                  <Link href={`/clients/${job.client.id}`} className="text-brand-700 hover:underline">
                    {job.client.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd><StatusBadge value={job.status} /></dd>
              </div>
              <div>
                <dt className="text-slate-400">Assigned to</dt>
                <dd className="text-slate-800">{job.assignedTo?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Scheduled</dt>
                <dd className="text-slate-800">{formatDate(job.scheduledDate)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Site address</dt>
                <dd className="text-slate-800">{job.siteAddress || "—"}</dd>
              </div>
              {job.description && (
                <div className="col-span-2">
                  <dt className="text-slate-400">Description</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{job.description}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title={`Photos${job.photos.length ? ` (${job.photos.length})` : ""}`} />
            <JobPhotos jobId={job.id} photos={job.photos} />
          </Card>

          <Card>
            <CardHeader title="Communications" />
            {job.communications.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">
                No communications logged against this job. Add them from the{" "}
                <Link href={`/clients/${job.client.id}`} className="text-brand-600 hover:underline">
                  client page
                </Link>
                .
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {job.communications.map((c) => (
                  <div key={c.id} className="px-5 py-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                      <StatusBadge value={c.type} />
                      <span>{formatDateTime(c.createdAt)}</span>
                      <span>· {c.createdBy.name}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Invoices & quotes"
              action={
                <Link
                  href={`/invoices/new?clientId=${job.client.id}&jobId=${job.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Add
                </Link>
              }
            />
            {job.invoices.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {job.invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700">
                        {inv.type === "QUOTE" ? "Quote" : "Invoice"} #{inv.number}
                        <span className="ml-2 text-slate-400">{formatCurrency(inv.total)}</span>
                      </span>
                      <StatusBadge value={inv.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
