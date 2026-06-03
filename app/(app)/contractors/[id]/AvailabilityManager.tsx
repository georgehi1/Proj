"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Select } from "@/components/ui";
import { availabilitySchema, type AvailabilityInput } from "@/lib/validation";
import { addAvailability, deleteAvailability } from "../actions";

type Window = {
  id: string;
  kind: "AVAILABLE" | "TIME_OFF";
  start: string;
  end: string;
  note: string | null;
};

function fmt(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AvailabilityManager({
  contractorId,
  windows,
}: {
  contractorId: string;
  windows: Window[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvailabilityInput>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { kind: "AVAILABLE", startDate: "", endDate: "", note: "" },
  });

  const onSubmit = (values: AvailabilityInput) => {
    setServerError(undefined);
    startTransition(async () => {
      const res = await addAvailability(contractorId, values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      await deleteAvailability(id);
      router.refresh();
    });
  };

  return (
    <div className="px-5 py-4">
      {windows.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No availability recorded yet.</p>
      ) : (
        <ul className="mb-4 space-y-1.5">
          {windows.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    w.kind === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {w.kind === "AVAILABLE" ? "Available" : "Time off"}
                </span>
                <span className="text-slate-700">
                  {fmt(w.start)} – {fmt(w.end)}
                </span>
                {w.note && <span className="text-slate-400">· {w.note}</span>}
              </span>
              <button
                type="button"
                onClick={() => onDelete(w.id)}
                disabled={isPending}
                className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Delete window"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
      >
        <Field label="Type" htmlFor="kind">
          <Select id="kind" {...register("kind")}>
            <option value="AVAILABLE">Available</option>
            <option value="TIME_OFF">Time off</option>
          </Select>
        </Field>
        <Field label="From" htmlFor="startDate" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...register("startDate")} />
        </Field>
        <Field label="To" htmlFor="endDate" error={errors.endDate?.message}>
          <Input id="endDate" type="date" {...register("endDate")} />
        </Field>
        <Field label="Note (optional)" htmlFor="note">
          <Input id="note" {...register("note")} placeholder="e.g. half days" />
        </Field>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Saving…" : "Add"}
        </Button>
      </form>
      {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}
    </div>
  );
}
