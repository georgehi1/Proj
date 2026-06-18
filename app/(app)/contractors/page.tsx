import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function ContractorsPage() {
  const contractors = await prisma.contractor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { jobs: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Contractors"
        subtitle="Tradespeople you assign work to."
        action={<LinkButton href="/contractors/new">New contractor</LinkButton>}
      />

      {contractors.length === 0 ? (
        <EmptyState
          title="No contractors yet"
          message="Add the tradespeople you assign work to. You can optionally give them a login to see their own jobs."
          action={<LinkButton href="/contractors/new">Add your first contractor</LinkButton>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Trade</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">Jobs</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractors.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/contractors/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                    {c.companyName && (
                      <span className="ml-2 text-xs text-slate-400">{c.companyName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.trade || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone || c.email || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c._count.jobs}</td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
