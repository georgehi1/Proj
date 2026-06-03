import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ListFilters } from "@/components/ListFilters";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;

  const clients = await prisma.client.findMany({
    where: {
      ...(type === "RESIDENTIAL" || type === "COMMERCIAL" ? { type } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { town: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { jobs: true, invoices: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Everyone you work for, residential and commercial."
        action={<LinkButton href="/clients/new">New client</LinkButton>}
      />

      <ListFilters
        searchPlaceholder="Search name, email or town…"
        filters={[
          {
            name: "type",
            options: [
              { value: "", label: "All types" },
              { value: "RESIDENTIAL", label: "Residential" },
              { value: "COMMERCIAL", label: "Commercial" },
            ],
          },
        ]}
      />

      {clients.length === 0 ? (
        <EmptyState message="No clients found. Add your first client to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Town</th>
                <th className="px-4 py-3 font-medium text-right">Jobs</th>
                <th className="px-4 py-3 font-medium text-right">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.type} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.town || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c._count.jobs}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c._count.invoices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
