"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { uploadJobPhotos, deleteJobPhoto } from "../actions";

type Photo = { id: string; filename: string };

export function JobPhotos({
  jobId,
  photos,
}: {
  jobId: string;
  photos: Photo[];
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
      const res = await uploadJobPhotos(jobId, fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function onDelete(photoId: string) {
    if (!window.confirm("Delete this photo?")) return;
    startDelete(async () => {
      await deleteJobPhoto(photoId);
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4">
      {photos.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No photos yet.</p>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              <a href={`/jobs/${jobId}/photos/${p.id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- user uploads served from our own auth'd route; next/image optimisation is unnecessary here */}
                <img
                  src={`/jobs/${jobId}/photos/${p.id}`}
                  alt={p.filename}
                  className="h-32 w-full rounded-lg border border-slate-200 object-cover"
                />
              </a>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                disabled={isDeleting}
                className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex hover:bg-red-600"
                aria-label={`Delete ${p.filename}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="photos"
          accept="image/*"
          multiple
          required
          className="block max-w-xs text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <Button type="submit" variant="secondary" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">Up to 10MB each · images only.</p>
    </div>
  );
}
