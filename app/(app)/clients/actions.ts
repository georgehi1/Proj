"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  clientSchema,
  communicationSchema,
  type ClientInput,
  type CommunicationInput,
} from "@/lib/validation";

export type SaveResult = { ok: boolean; id?: string; error?: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function saveClient(
  id: string | null,
  input: ClientInput
): Promise<SaveResult> {
  await requireUser();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    type: d.type,
    email: clean(d.email),
    phone: clean(d.phone),
    addressLine1: clean(d.addressLine1),
    addressLine2: clean(d.addressLine2),
    town: clean(d.town),
    postcode: clean(d.postcode),
    notes: clean(d.notes),
  };

  const client = id
    ? await prisma.client.update({ where: { id }, data })
    : await prisma.client.create({ data });

  revalidatePath("/clients");
  if (id) revalidatePath(`/clients/${id}`);
  return { ok: true, id: client.id };
}

export async function deleteClient(id: string) {
  await requireUser();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function addCommunication(input: CommunicationInput): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = communicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  await prisma.communication.create({
    data: {
      clientId: d.clientId,
      jobId: clean(d.jobId),
      type: d.type,
      body: d.body,
      createdById: user.id,
    },
  });
  revalidatePath(`/clients/${d.clientId}`);
  if (d.jobId) revalidatePath(`/jobs/${d.jobId}`);
  return { ok: true };
}
