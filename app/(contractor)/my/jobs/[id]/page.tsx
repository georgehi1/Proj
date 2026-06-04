import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, toNumber } from "@/lib/format";
import { requireContractor } from "@/lib/contractor";
import { JobStatusControl } from "@/app/(app)/jobs/[id]/JobStatusControl";
import { JobPhotos } from "@/app/(app)/jobs/[id]/JobPhotos";
import { ContractorMaterials } from "./ContractorMaterials";
import type { JobStatus } from "@prisma/client";

// Statuses a contractor can move a job between (must mirror the server guard
// in jobs/actions.ts). The job's current status is always shown too.
const CONTRACTOR_STATUSES: JobStatus[] = ["SCHEDULED", "IN_PROGRESS", "COMPLETED"];

export default async function ContractorJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { contractorId } = await requireContractor();

  const job = await prisma.job.findFirst({
    where: { id, contractors: { some: { id: contractorId } } },
    include: {
      client: { select: { name: true } },
      contractors: { select: { id: true, name: true, trade: true } },
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, filename: true },
      },
      materials: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job) notFound();

  const statuses = CONTRACTOR_STATUSES.includes(job.status)
    ? CONTRACTOR_STATUSES
    : [job.status, ...CONTRACTOR_STATUSES];

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`For ${job.client.name}`}
        action={
          <div className="flex items-center gap-2">
            <JobStatusControl jobId={job.id} status={job.status} statuses={statuses} />
            <LinkButton href="/my/jobs" variant="secondary">
              Back to jobs
            </LinkButton>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">Client</dt>
                <dd className="text-slate-800">{job.client.name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd><StatusBadge value={job.status} /></dd>
              </div>
              <div>
                <dt className="text-slate-400">Scheduled</dt>
                <dd className="text-slate-800">{formatDate(job.scheduledDate)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="mb-1 text-slate-400">Team</dt>
                <dd>
                  {job.contractors.length === 0 ? (
                    <span className="text-slate-800">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {job.contractors.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                        >
                          {c.name}
                          {c.trade && <span className="text-brand-400">· {c.trade}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Site address</dt>
                <dd className="text-slate-800">
                  {job.siteAddress ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.siteAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                      title="Open in Google Maps"
                    >
                      <span aria-hidden>📍</span>
                      {job.siteAddress}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {job.description && (
                <div className="col-span-2">
                  <dt className="text-slate-400">Description</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{job.description}</dd>
                </div>
              )}
              {job.notes && (
                <div className="col-span-2">
                  <dt className="text-slate-400">Additional notes</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{job.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title={`Photos${job.photos.length ? ` (${job.photos.length})` : ""}`} />
            <JobPhotos jobId={job.id} photos={job.photos} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={`Materials${job.materials.length ? ` (${job.materials.length})` : ""}`} />
            <ContractorMaterials
              materials={job.materials.map((m) => ({
                id: m.id,
                name: m.name,
                quantity: toNumber(m.quantity),
                unit: m.unit,
                status: m.status,
                notes: m.notes,
              }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
