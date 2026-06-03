"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { contractorSchema, type ContractorInput } from "@/lib/validation";
import { saveContractor } from "./actions";

export function ContractorForm({
  id,
  defaults,
}: {
  id?: string;
  defaults?: Partial<ContractorInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractorInput>({
    resolver: zodResolver(contractorSchema),
    defaultValues: {
      name: "",
      trade: "",
      companyName: "",
      email: "",
      phone: "",
      dayRate: "",
      notes: "",
      active: true,
      ...defaults,
    },
  });

  const onSubmit = (values: ContractorInput) => {
    setServerError(undefined);
    startTransition(async () => {
      const res = await saveContractor(id ?? null, values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.push(`/contractors/${res.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Trade / specialty" htmlFor="trade">
            <Input id="trade" {...register("trade")} placeholder="e.g. Plumber, Electrician" />
          </Field>
          <Field label="Company (optional)" htmlFor="companyName">
            <Input id="companyName" {...register("companyName")} />
          </Field>
          <Field label="Day rate (£, optional)" htmlFor="dayRate">
            <Input id="dayRate" type="number" step="0.01" {...register("dayRate")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field label="Status" htmlFor="active">
            <Select id="active" {...register("active", {
              setValueAs: (v) => v === "true" || v === true,
            })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <div />
          <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" {...register("notes")} />
          </Field>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : id ? "Save changes" : "Add contractor"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
