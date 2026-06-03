"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { Button, Card, Field, Select } from "@/components/ui";
import { importClients, type ImportClientRow, type ImportResult } from "../actions";

type TargetKey = keyof ImportClientRow;

const TARGETS: { key: TargetKey; label: string; keywords: string[] }[] = [
  { key: "name", label: "Name *", keywords: ["name", "client", "customer", "company"] },
  { key: "type", label: "Type (residential/commercial)", keywords: ["type", "category"] },
  { key: "email", label: "Email", keywords: ["email", "e-mail", "mail"] },
  { key: "phone", label: "Phone", keywords: ["phone", "tel", "mobile", "contact", "number"] },
  { key: "addressLine1", label: "Address line 1", keywords: ["address1", "addressline1", "address", "street"] },
  { key: "addressLine2", label: "Address line 2", keywords: ["address2", "addressline2"] },
  { key: "town", label: "Town / city", keywords: ["town", "city"] },
  { key: "postcode", label: "Postcode", keywords: ["postcode", "postalcode", "zip", "post"] },
  { key: "notes", label: "Notes", keywords: ["notes", "note", "comment"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function autoMap(columns: string[]): Record<TargetKey, string> {
  const used = new Set<string>();
  const map = {} as Record<TargetKey, string>;
  for (const t of TARGETS) {
    const match = columns.find(
      (c) => !used.has(c) && t.keywords.some((k) => norm(c).includes(norm(k)))
    );
    map[t.key] = match ?? "";
    if (match) used.add(match);
  }
  return map;
}

export function ImportClients() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>();
  const [fileName, setFileName] = useState<string>();
  const [parseError, setParseError] = useState<string>();
  const [result, setResult] = useState<ImportResult>();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(undefined);
    setResult(undefined);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = (res.meta.fields ?? []).filter(Boolean);
        if (cols.length === 0) {
          setParseError("Couldn't read any columns. Is this a CSV with a header row?");
          return;
        }
        setColumns(cols);
        setRows(res.data);
        setMapping(autoMap(cols));
      },
      error: (err) => setParseError(err.message),
    });
  }

  function buildRows(): ImportClientRow[] {
    if (!mapping) return [];
    return rows.map((row) => {
      const out: ImportClientRow = {};
      for (const t of TARGETS) {
        const col = mapping[t.key];
        if (col) out[t.key] = row[col]?.trim();
      }
      return out;
    });
  }

  const mappedPreview = buildRows();
  const withName = mappedPreview.filter((r) => r.name).length;

  function onImport() {
    const data = buildRows();
    startTransition(async () => {
      const res = await importClients(data);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">1. Choose a CSV file</h2>
        <p className="mb-4 text-sm text-slate-500">
          In Excel or Google Sheets, use <strong>File → Save As / Download → CSV</strong>, then
          upload it here. The first row should be your column headings.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        {fileName && !parseError && (
          <p className="mt-2 text-xs text-slate-400">
            Loaded {rows.length} rows from {fileName}.
          </p>
        )}
        {parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
      </Card>

      {mapping && columns.length > 0 && (
        <>
          <Card className="p-6">
            <h2 className="mb-1 text-sm font-semibold text-slate-800">2. Match your columns</h2>
            <p className="mb-4 text-sm text-slate-500">
              We&apos;ve guessed these from your headings — adjust any that are wrong. Only{" "}
              <strong>Name</strong> is required.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {TARGETS.map((t) => (
                <Field key={t.key} label={t.label} htmlFor={`map-${t.key}`}>
                  <Select
                    id={`map-${t.key}`}
                    value={mapping[t.key]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [t.key]: e.target.value })
                    }
                  >
                    <option value="">— Don&apos;t import —</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-1 text-sm font-semibold text-slate-800">3. Preview &amp; import</h2>
            <p className="mb-4 text-sm text-slate-500">
              {withName} of {rows.length} rows have a name and will be considered. Rows that match
              an existing client by name, email or phone are skipped automatically.
            </p>
            {!mapping.name && (
              <p className="mb-3 text-sm text-amber-600">
                Map a column to <strong>Name</strong> to enable import.
              </p>
            )}
            <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Town</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedPreview.slice(0, 8).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-slate-700">{r.name || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {r.type
                          ? r.type.toLowerCase().includes("comm")
                            ? "Commercial"
                            : "Residential"
                          : "Residential"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.email || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{r.phone || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{r.town || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result ? (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                Imported <strong>{result.created}</strong> new client
                {result.created === 1 ? "" : "s"}
                {result.skipped > 0 && <> · skipped {result.skipped} duplicate{result.skipped === 1 ? "" : "s"}</>}.{" "}
                <Link href="/clients" className="font-medium underline">
                  View clients
                </Link>
              </div>
            ) : (
              <Button onClick={onImport} disabled={isPending || !mapping.name || withName === 0}>
                {isPending ? "Importing…" : `Import ${withName} client${withName === 1 ? "" : "s"}`}
              </Button>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
