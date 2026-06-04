import { startOfDay, endOfDay, addDays, format, isToday } from "date-fns";
import { prisma } from "@/lib/db";
import { LinkButton, PageHeader, EmptyState } from "@/components/ui";
import { formatCurrency, toNumber } from "@/lib/format";
import { getReferenceDate } from "@/lib/calendar";
import { buildShoppingList, type ShoppingItem } from "@/lib/shopping";
import { ShoppingList } from "./ShoppingList";

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = getReferenceDate(dateParam);
  const start = startOfDay(date);
  const end = endOfDay(date);

  // Jobs happening that day that still have something outstanding to buy.
  const jobs = await prisma.job.findMany({
    where: {
      scheduledDate: { gte: start, lte: end },
      status: { not: "CANCELLED" },
      materials: { some: { status: { not: "RECEIVED" } } },
    },
    orderBy: { scheduledDate: "asc" },
    select: {
      id: true,
      reference: true,
      title: true,
      client: { select: { name: true } },
      materials: {
        where: { status: { not: "RECEIVED" } },
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          unitCost: true,
          supplier: true,
          sku: true,
          sourceUrl: true,
          status: true,
        },
      },
    },
  });

  const items: ShoppingItem[] = jobs.flatMap((job) =>
    job.materials.map((m) => ({
      id: m.id,
      name: m.name,
      quantity: toNumber(m.quantity),
      unit: m.unit,
      unitCost: m.unitCost == null ? null : toNumber(m.unitCost),
      supplier: m.supplier,
      sku: m.sku,
      sourceUrl: m.sourceUrl,
      status: m.status,
      jobId: job.id,
      jobRef: job.reference,
      jobTitle: job.title,
      clientName: job.client.name,
    }))
  );

  const { groups, itemCount, total } = buildShoppingList(items);
  const dayParam = (d: Date) => format(d, "yyyy-MM-dd");
  const heading = isToday(date) ? "Today" : format(date, "EEEE d MMM yyyy");

  return (
    <div>
      <PageHeader
        title="Shopping list"
        subtitle="Materials still needed for jobs scheduled on a given day."
        action={
          <div className="flex items-center gap-2">
            <LinkButton href={`/shopping?date=${dayParam(addDays(date, -1))}`} variant="secondary">
              ‹
            </LinkButton>
            <LinkButton href="/shopping" variant="secondary">
              Today
            </LinkButton>
            <LinkButton href={`/shopping?date=${dayParam(addDays(date, 1))}`} variant="secondary">
              ›
            </LinkButton>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {heading}
          <span className="ml-1 text-sm font-normal text-slate-400">
            {format(date, "d MMM yyyy")}
          </span>
        </h2>
        {itemCount > 0 && (
          <p className="text-sm text-slate-500">
            {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-slate-700">{formatCurrency(total)}</span> est.
          </p>
        )}
      </div>

      {itemCount === 0 ? (
        <EmptyState message="Nothing to buy — every material for this day's jobs is marked received." />
      ) : (
        <ShoppingList groups={groups} />
      )}
    </div>
  );
}
