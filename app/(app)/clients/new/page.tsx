import { PageHeader } from "@/components/ui";
import { ClientForm } from "../ClientForm";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="New client" />
      <ClientForm />
    </div>
  );
}
