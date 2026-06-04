"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  enableContractorLogin,
  resetContractorPassword,
  disableContractorLogin,
} from "../actions";

export function ContractorLoginManager({
  contractorId,
  hasLogin,
  loginEmail,
  contractorEmail,
}: {
  contractorId: string;
  hasLogin: boolean;
  loginEmail: string | null;
  contractorEmail: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [password, setPassword] = useState<string>();

  function run(fn: () => Promise<{ ok: boolean; password?: string; error?: string }>) {
    setError(undefined);
    setPassword(undefined);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.password) setPassword(res.password);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 px-5 py-4 text-sm">
      {hasLogin ? (
        <>
          <p className="text-slate-600">
            Portal login is <span className="font-medium text-green-700">enabled</span>
            {loginEmail && (
              <>
                {" "}for <span className="font-medium text-slate-800">{loginEmail}</span>
              </>
            )}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run(() => resetContractorPassword(contractorId))}
            >
              Reset password
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("Remove this contractor's login?")) return;
                run(() => disableContractorLogin(contractorId));
              }}
            >
              Disable login
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-slate-600">
            No portal login yet. Enabling one lets this contractor sign in to see
            their own jobs and manage their availability.
          </p>
          {!contractorEmail && (
            <p className="text-amber-700">
              Add an email address to this contractor first — it becomes their login.
            </p>
          )}
          <Button
            disabled={isPending || !contractorEmail}
            onClick={() => run(() => enableContractorLogin(contractorId))}
          >
            {isPending ? "Working…" : "Enable login"}
          </Button>
        </>
      )}

      {password && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
          <p className="font-medium text-green-800">One-time password</p>
          <p className="mt-1 text-slate-700">
            Share this with the contractor securely — it won&apos;t be shown again.
          </p>
          <code className="mt-2 block rounded bg-white px-2 py-1.5 font-mono text-base tracking-wide text-slate-900">
            {password}
          </code>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
