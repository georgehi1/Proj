"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { updateJobMaterialStatus } from "@/app/(app)/jobs/actions";
import type { MaterialStatus } from "@prisma/client";

type Material = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  status: MaterialStatus;
  notes: string | null;
};

const STATUSES: MaterialStatus[] = ["NEEDED", "ORDERED", "RECEIVED"];

// Contractor-facing materials list: shows what's needed and lets the
// tradesperson move items along the procurement track. No costs or suppliers.
export function ContractorMaterials({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [isUpdating, startUpdate] = useTransition();

  function onStatus(id: string, status: MaterialStatus) {
    startUpdate(async () => {
      await updateJobMaterialStatus(id, status);
      router.refresh();
    });
  }

  if (materials.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-400">No materials listed for this job.</p>;
  }

  return (
    <div className="px-5 py-4">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 pr-3 font-medium">Material</th>
            <th className="py-2 pr-3 text-right font-medium">Qty</th>
            <th className="py-2 pr-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {materials.map((m) => (
            <tr key={m.id}>
              <td className="py-2 pr-3 text-slate-700">
                {m.name}
                {m.notes && <span className="block text-xs text-slate-400">{m.notes}</span>}
              </td>
              <td className="py-2 pr-3 text-right text-slate-600">
                {m.quantity}
                {m.unit ? ` ${m.unit}` : ""}
              </td>
              <td className="py-2 pr-3">
                <Select
                  value={m.status}
                  disabled={isUpdating}
                  onChange={(e) => onStatus(m.id, e.target.value as MaterialStatus)}
                  className="max-w-36"
                  aria-label={`Status for ${m.name}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
