"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { safeExternalHref } from "@/lib/http";
import { searchSupplierMaterials, addJobMaterial } from "../actions";
import type { SupplierResult } from "@/lib/suppliers";

export function MaterialSearch({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierResult[]>();
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string>();
  const [addedSku, setAddedSku] = useState<string>();
  const [isSearching, startSearch] = useTransition();
  const [isAdding, startAdd] = useTransition();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(undefined);
    setAddedSku(undefined);
    startSearch(async () => {
      const res = await searchSupplierMaterials(query);
      if (!res.ok) {
        setError(res.error);
        setResults([]);
        return;
      }
      setLive(Boolean(res.live));
      setResults(res.results ?? []);
    });
  }

  function onAdd(r: SupplierResult) {
    startAdd(async () => {
      await addJobMaterial(jobId, {
        name: r.name,
        quantity: 1,
        unitCost: r.price ?? "",
        supplier: r.supplier,
        sku: r.sku ?? undefined,
        sourceUrl: r.url ?? undefined,
        status: "NEEDED",
      });
      setAddedSku(r.sku ?? r.name);
      router.refresh();
    });
  }

  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search materials (e.g. 15mm copper pipe)"
          className="flex-1"
          aria-label="Search materials"
        />
        <Button type="submit" variant="secondary" disabled={isSearching}>
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {results && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {results.length} result{results.length === 1 ? "" : "s"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 ${
                live ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
              }`}
              title={
                live
                  ? "Live prices from the supplier"
                  : "Indicative prices from the in-app catalogue — confirm before ordering"
              }
            >
              {live ? "Live prices" : "Indicative prices"}
            </span>
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-slate-400">No matches — try different keywords.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {results.map((r, i) => (
                <li key={`${r.sku ?? r.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-slate-700">{r.name}</span>
                  <span className="w-16 text-right text-slate-800">
                    {r.price == null ? "—" : formatCurrency(r.price)}
                  </span>
                  {safeExternalHref(r.url) && (
                    <a
                      href={safeExternalHref(r.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Buy
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onAdd(r)}
                    disabled={isAdding}
                  >
                    {addedSku === (r.sku ?? r.name) ? "Added ✓" : "Add"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
