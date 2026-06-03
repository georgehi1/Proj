"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { jobSchema, type JobInput } from "@/lib/validation";
import type { JobStatus } from "@prisma/client";

export type SaveResult = { ok: boolean; id?: string; error?: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function saveJob(
  id: string | null,
  input: JobInput
): Promise<SaveResult> {
  await requireUser();
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const data = {
    clientId: d.clientId,
    title: d.title,
    description: clean(d.description),
    status: d.status,
    siteAddress: clean(d.siteAddress),
    scheduledDate: d.scheduledDate ? new Date(d.scheduledDate) : null,
    assignedToId: clean(d.assignedToId),
  };

  const job = id
    ? await prisma.job.update({ where: { id }, data })
    : await prisma.job.create({ data });

  revalidatePath("/jobs");
  revalidatePath(`/clients/${d.clientId}`);
  if (id) revalidatePath(`/jobs/${id}`);
  return { ok: true, id: job.id };
}

export async function updateJobStatus(id: string, status: JobStatus) {
  await requireUser();
  const job = await prisma.job.update({ where: { id }, data: { status } });
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  revalidatePath(`/clients/${job.clientId}`);
}

export async function deleteJob(id: string) {
  await requireUser();
  const job = await prisma.job.delete({ where: { id } });
  revalidatePath("/jobs");
  revalidatePath(`/clients/${job.clientId}`);
  redirect("/jobs");
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadJobPhotos(
  jobId: string,
  formData: FormData
): Promise<SaveResult> {
  await requireUser();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { ok: false, error: "Please choose at least one image." };
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: `"${file.name}" is not an image.` };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: `"${file.name}" is larger than 10MB.` };
    }
  }

  const photos = await Promise.all(
    files.map(async (file) => ({
      jobId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    }))
  );

  await prisma.jobPhoto.createMany({ data: photos });

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true, id: jobId };
}

export async function deleteJobPhoto(photoId: string) {
  await requireUser();
  const photo = await prisma.jobPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/jobs/${photo.jobId}`);
}
