"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Textarea } from "@/components/ui";
import { addCommunication } from "../actions";

type JobOption = { id: string; title: string };

export function AddCommunicationForm({
  clientId,
  jobs,
}: {
  clientId: string;
  jobs: JobOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const res = await addCommunication({
        clientId,
        type: fd.get("type") as "CALL" | "EMAIL" | "NOTE" | "SITE_VISIT",
        jobId: (fd.get("jobId") as string) || undefined,
        body: String(fd.get("body") ?? ""),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap gap-3">
        <Select name="type" defaultValue="NOTE" className="max-w-40">
          <option value="NOTE">Note</option>
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="SITE_VISIT">Site visit</option>
        </Select>
        {jobs.length > 0 && (
          <Select name="jobId" defaultValue="" className="max-w-56">
            <option value="">No linked job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        )}
      </div>
      <Textarea name="body" placeholder="What happened? e.g. Called to confirm start date…" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging…" : "Log communication"}
      </Button>
    </form>
  );
}
