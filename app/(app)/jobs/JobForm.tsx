"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { jobSchema, type JobInput } from "@/lib/validation";
import { saveJob } from "./actions";

const STATUSES: JobInput["status"][] = [
  "ENQUIRY",
  "QUOTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function JobForm({
  id,
  defaults,
  clients,
  contractors,
}: {
  id?: string;
  defaults?: Partial<JobInput>;
  clients: { id: string; name: string }[];
  contractors: { id: string; name: string; trade: string | null }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      status: "ENQUIRY",
      siteAddress: "",
      scheduledDate: "",
      contractorIds: [],
      ...defaults,
    },
  });

  const onSubmit = (values: JobInput) => {
    setServerError(undefined);
    startTransition(async () => {
      const res = await saveJob(id ?? null, values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.push(`/jobs/${res.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="space-y-4 p-6">
        <Field label="Client" htmlFor="clientId" error={errors.clientId?.message}>
          <Select id="clientId" {...register("clientId")}>
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" {...register("title")} placeholder="e.g. Bathroom refurbishment" />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea id="description" {...register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status">
            <Select id="status" {...register("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled date" htmlFor="scheduledDate">
            <Input id="scheduledDate" type="date" {...register("scheduledDate")} />
          </Field>
          <Field label="Site address" htmlFor="siteAddress" className="sm:col-span-2">
            <Input id="siteAddress" {...register("siteAddress")} />
          </Field>
        </div>

        <Field label="Contractors on this job">
          {contractors.length === 0 ? (
            <p className="text-sm text-slate-400">
              No contractors yet —{" "}
              <Link href="/contractors/new" className="text-brand-600 hover:underline">
                add one
              </Link>{" "}
              to assign it.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {contractors.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    value={c.id}
                    {...register("contractorIds")}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-700">{c.name}</span>
                  {c.trade && <span className="text-xs text-slate-400">{c.trade}</span>}
                </label>
              ))}
            </div>
          )}
        </Field>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : id ? "Save changes" : "Create job"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
