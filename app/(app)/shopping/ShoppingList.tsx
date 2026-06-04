"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { safeExternalHref } from "@/lib/http";
import { lineTotal, type ShoppingGroup, type ShoppingItem } from "@/lib/shopping";
import { setMaterialStatus } from "./actions";
import type { MaterialStatus } from "@prisma/client";

function ItemRow({ item }: { item: ShoppingItem }) {
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(checked: boolean) {
    setDone(checked); // optimistic
    const status: MaterialStatus = checked ? "RECEIVED" : item.status;
    startTransition(async () => {
      const res = await setMaterialStatus(item.id, status);
      if (!res.ok) setDone(!checked); // revert on failure
    });
  }

  const total = lineTotal(item);
  const sourceHref = safeExternalHref(item.sourceUrl);

  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => toggle(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        aria-label={`Mark ${item.name} as bought`}
      />
      <div className="min-w-0 flex-1">
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${done ? "opacity-50" : ""}`}>
          <span className={`text-sm text-slate-800 ${done ? "line-through" : ""}`}>
            {sourceHref ? (
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:underline"
              >
                {item.name}
              </a>
            ) : (
              item.name
            )}
          </span>
          {item.sku && <span className="text-xs text-slate-400">({item.sku})</span>}
          {item.status === "ORDERED" && <StatusBadge value="ORDERED" />}
        </div>
        <div className="mt-0.5 text-xs text-slate-400">
          <Link href={`/jobs/${item.jobId}`} className="hover:underline">
            #{item.jobRef} {item.jobTitle}
          </Link>
          <span> · {item.clientName}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm text-slate-700">
          {item.quantity}
          {item.unit ? ` ${item.unit}` : ""}
        </div>
        <div className="text-xs text-slate-400">{total > 0 ? formatCurrency(total) : "—"}</div>
      </div>
      {done && (
        <button
          type="button"
          onClick={() => toggle(false)}
          className="shrink-0 self-center text-xs font-medium text-brand-600 hover:underline"
        >
          Undo
        </button>
      )}
    </li>
  );
}

export function ShoppingList({ groups }: { groups: ShoppingGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.supplier}>
          <CardHeader
            title={group.supplier}
            action={
              group.subtotal > 0 ? (
                <span className="text-xs text-slate-500">
                  est. {formatCurrency(group.subtotal)}
                </span>
              ) : undefined
            }
          />
          <ul className="divide-y divide-slate-100">
            {group.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
