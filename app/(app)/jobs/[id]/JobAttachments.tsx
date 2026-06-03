"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { uploadJobAttachments, deleteJobAttachment } from "../actions";

type Attachment = { id: string; filename: string; size: number };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function JobAttachments({
  jobId,
  attachments,
}: {
  jobId: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const [isUploading, startUpload] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(undefined);
    startUpload(async () => {
      const res = await uploadJobAttachments(jobId, fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function onDelete(attachmentId: string) {
    if (!window.confirm("Delete this file?")) return;
    startDelete(async () => {
      await deleteJobAttachment(attachmentId);
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4">
      {attachments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No files yet.</p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <a
                href={`/jobs/${jobId}/attachments/${a.id}`}
                className="truncate text-brand-700 hover:underline"
              >
                {a.filename}
              </a>
              <span className="ml-3 flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-400">{formatBytes(a.size)}</span>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  disabled={isDeleting}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                  aria-label={`Delete ${a.filename}`}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          required
          className="block max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <Button type="submit" variant="secondary" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload files"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Any file type — certificates, plans, signed quotes. Up to 12MB each.
      </p>
    </div>
  );
}
