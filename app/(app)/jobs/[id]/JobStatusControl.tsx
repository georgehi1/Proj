"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { updateJobStatus } from "../actions";
import type { JobStatus } from "@prisma/client";

const STATUSES: JobStatus[] = [
  "ENQUIRY",
  "QUOTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function JobStatusControl({
  jobId,
  status,
  statuses = STATUSES,
}: {
  jobId: string;
  status: JobStatus;
  // Optionally restrict the selectable statuses (e.g. the contractor portal
  // only offers the on-site transitions).
  statuses?: JobStatus[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      className="max-w-44"
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as JobStatus;
        startTransition(async () => {
          await updateJobStatus(jobId, next);
          router.refresh();
        });
      }}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}
