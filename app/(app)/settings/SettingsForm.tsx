"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field, Input } from "@/components/ui";
import { settingsSchema, type SettingsInput } from "@/lib/validation";
import { saveSettings } from "./actions";

export function SettingsForm({ defaults }: { defaults: SettingsInput }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });

  const onSubmit = (values: SettingsInput) => {
    setMessage(undefined);
    startTransition(async () => {
      const res = await saveSettings(values);
      setMessage(
        res.ok
          ? { ok: true, text: "Settings saved." }
          : { ok: false, text: res.error ?? "Could not save." }
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="space-y-4 p-6">
        <p className="text-sm text-slate-500">
          These details appear on the quotes and invoices you generate.
        </p>
        <Field label="Company name" htmlFor="companyName" error={errors.companyName?.message}>
          <Input id="companyName" {...register("companyName")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>
          <Field label="VAT number" htmlFor="vatNumber">
            <Input id="vatNumber" {...register("vatNumber")} />
          </Field>
          <Field label="Default VAT rate (%)" htmlFor="defaultVatRate">
            <Input id="defaultVatRate" type="number" step="0.01" {...register("defaultVatRate")} />
          </Field>
          <Field label="Invoice number prefix" htmlFor="invoicePrefix">
            <Input id="invoicePrefix" {...register("invoicePrefix")} />
          </Field>
          <Field label="Quote number prefix" htmlFor="quotePrefix">
            <Input id="quotePrefix" {...register("quotePrefix")} />
          </Field>
        </div>

        {message && (
          <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </Card>
    </form>
  );
}
