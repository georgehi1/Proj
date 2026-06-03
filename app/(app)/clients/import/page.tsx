import { PageHeader } from "@/components/ui";
import { ImportClients } from "./ImportClients";

export default function ImportClientsPage() {
  return (
    <div>
      <PageHeader
        title="Import clients"
        subtitle="Bring your existing customer list in from a spreadsheet."
      />
      <ImportClients />
    </div>
  );
}
