import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { currentUser, isAdmin } from "@/lib/session";
import { formatCurrency, formatDateTime, humanize } from "@/lib/format";
import { deleteClient } from "../actions";
import { AddCommunicationForm } from "./AddCommunicationForm";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = isAdmin(await currentUser());
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      jobs: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      communications: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } }, job: { select: { title: true } } },
      },
    },
  });
  if (!client) notFound();

  const addressParts = [
    client.addressLine1,
    client.addressLine2,
    client.town,
    client.postcode,
  ].filter(Boolean);

  async function onDelete() {
    "use server";
    await deleteClient(id);
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={humanize(client.type) + " client"}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/clients/${client.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            {admin && (
              <ConfirmButton
                action={onDelete}
                label="Delete"
                confirmMessage={`Delete ${client.name}? This removes their jobs, invoices and communication history.`}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: profile + comms */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">Phone</dt>
                <dd className="text-slate-800">{client.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="text-slate-800">{client.email || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Address</dt>
                <dd className="text-slate-800">
                  {addressParts.length ? addressParts.join(", ") : "—"}
                </dd>
              </div>
              {client.notes && (
                <div className="col-span-2">
                  <dt className="text-slate-400">Notes</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{client.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Communication log" />
            <AddCommunicationForm
              clientId={client.id}
              jobs={client.jobs.map((j) => ({ id: j.id, title: j.title }))}
            />
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {client.communications.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">
                  No communications logged yet.
                </p>
              ) : (
                client.communications.map((c) => (
                  <div key={c.id} className="px-5 py-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                      <StatusBadge value={c.type} />
                      <span>{formatDateTime(c.createdAt)}</span>
                      <span>· {c.createdBy.name}</span>
                      {c.job && <span>· {c.job.title}</span>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column: jobs + invoices */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Jobs"
              action={
                <Link
                  href={`/jobs/new?clientId=${client.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Add
                </Link>
              }
            />
            {client.jobs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">No jobs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {client.jobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700">{j.title}</span>
                      <StatusBadge value={j.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Invoices & quotes"
              action={
                <Link
                  href={`/invoices/new?clientId=${client.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  + Add
                </Link>
              }
            />
            {client.invoices.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {client.invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700">
                        {humanize(inv.type)} #{inv.number}
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
