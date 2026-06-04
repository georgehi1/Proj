"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import {
  addJobMaterial,
  updateJobMaterialStatus,
  deleteJobMaterial,
} from "../actions";
import type { MaterialStatus } from "@prisma/client";

type Material = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitCost: number | null;
  supplier: string | null;
  sku: string | null;
  sourceUrl: string | null;
  status: MaterialStatus;
  notes: string | null;
};

const STATUSES: MaterialStatus[] = ["NEEDED", "ORDERED", "RECEIVED"];

function lineTotal(m: Material): number | null {
  return m.unitCost == null ? null : m.quantity * m.unitCost;
}

export function JobMaterials({
  jobId,
  materials,
}: {
  jobId: string;
  materials: Material[];
}) {
  const router = useRouter();
  const [isAdding, startAdd] = useTransition();
  const [isUpdating, startUpdate] = useTransition();
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  const estimate = materials.reduce((sum, m) => sum + (lineTotal(m) ?? 0), 0);

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(undefined);
    const rawCost = (fd.get("unitCost") as string) ?? "";
    startAdd(async () => {
      const res = await addJobMaterial(jobId, {
        name: String(fd.get("name") ?? ""),
        quantity: Number(fd.get("quantity") || 1),
        unit: (fd.get("unit") as string) || undefined,
        unitCost: rawCost === "" ? "" : Number(rawCost),
        supplier: (fd.get("supplier") as string) || undefined,
        status: fd.get("status") as MaterialStatus,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  function onStatus(id: string, status: MaterialStatus) {
    startUpdate(async () => {
      await updateJobMaterialStatus(id, status);
      router.refresh();
    });
  }

  function onDelete(id: string, name: string) {
    if (!window.confirm(`Remove "${name}" from the materials list?`)) return;
    startUpdate(async () => {
      await deleteJobMaterial(id);
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4">
      {materials.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No materials tracked yet.</p>
      ) : (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Material</th>
                <th className="py-2 pr-3 text-right font-medium">Qty</th>
                <th className="py-2 pr-3 text-right font-medium">Unit cost</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Supplier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3 text-slate-700">
                    {m.sourceUrl ? (
                      <a
                        href={m.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 hover:underline"
                      >
                        {m.name}
                      </a>
                    ) : (
                      m.name
                    )}
                    {m.sku && <span className="ml-1 text-xs text-slate-400">({m.sku})</span>}
                    {m.notes && (
                      <span className="block text-xs text-slate-400">{m.notes}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-600">
                    {m.quantity}
                    {m.unit ? ` ${m.unit}` : ""}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-600">
                    {m.unitCost == null ? "—" : formatCurrency(m.unitCost)}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-800">
                    {lineTotal(m) == null ? "—" : formatCurrency(lineTotal(m)!)}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{m.supplier || "—"}</td>
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
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(m.id, m.name)}
                      disabled={isUpdating}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                      aria-label={`Delete ${m.name}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="py-2 pr-3 text-right text-xs uppercase tracking-wide text-slate-400">
                  Estimated total
                </td>
                <td className="py-2 pr-3 text-right font-semibold text-slate-900">
                  {formatCurrency(estimate)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <form ref={formRef} onSubmit={onAdd} className="flex flex-wrap items-end gap-2">
        <Input name="name" placeholder="Material" required className="w-40" aria-label="Material name" />
        <Input
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          defaultValue="1"
          className="w-20"
          aria-label="Quantity"
        />
        <Input name="unit" placeholder="Unit" className="w-20" aria-label="Unit" />
        <Input
          name="unitCost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Unit cost"
          className="w-24"
          aria-label="Unit cost"
        />
        <Input name="supplier" placeholder="Supplier" className="w-32" aria-label="Supplier" />
        <Select name="status" defaultValue="NEEDED" className="w-32" aria-label="Status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" disabled={isAdding}>
          {isAdding ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
