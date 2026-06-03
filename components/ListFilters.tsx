"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input, Select } from "@/components/ui";

type Option = { value: string; label: string };
type Filter = { name: string; options: Option[] };

export function ListFilters({
  searchPlaceholder,
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: Filter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {searchPlaceholder && (
        <Input
          className="max-w-xs"
          placeholder={searchPlaceholder}
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
        />
      )}
      {filters.map((f) => (
        <Select
          key={f.name}
          className="max-w-44"
          defaultValue={params.get(f.name) ?? ""}
          onChange={(e) => update(f.name, e.target.value)}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ))}
    </div>
  );
}
