"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { clientSchema, type ClientInput } from "@/lib/validation";
import { saveClient } from "./actions";

export function ClientForm({
  id,
  defaults,
}: {
  id?: string;
  defaults?: Partial<ClientInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: "RESIDENTIAL",
      name: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      town: "",
      postcode: "",
      notes: "",
      ...defaults,
    },
  });

  const onSubmit = (values: ClientInput) => {
    setServerError(undefined);
    startTransition(async () => {
      const res = await saveClient(id ?? null, values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.push(`/clients/${res.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Type" htmlFor="type">
            <Select id="type" {...register("type")}>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </Select>
          </Field>
          <div />
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field label="Address line 1" htmlFor="addressLine1">
            <Input id="addressLine1" {...register("addressLine1")} />
          </Field>
          <Field label="Address line 2" htmlFor="addressLine2">
            <Input id="addressLine2" {...register("addressLine2")} />
          </Field>
          <Field label="Town" htmlFor="town">
            <Input id="town" {...register("town")} />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input id="postcode" {...register("postcode")} />
          </Field>
          <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" {...register("notes")} />
          </Field>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : id ? "Save changes" : "Create client"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
