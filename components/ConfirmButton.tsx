"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

function Inner({ label, confirmMessage }: { label: string; confirmMessage: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="danger"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}

export function ConfirmButton({
  action,
  label = "Delete",
  confirmMessage = "Are you sure? This cannot be undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form action={action}>
      <Inner label={label} confirmMessage={confirmMessage} />
    </form>
  );
}
