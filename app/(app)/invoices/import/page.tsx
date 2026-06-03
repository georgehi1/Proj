import { PageHeader } from "@/components/ui";
import { ImportDocument } from "./ImportDocument";

export default function ImportInvoicePage() {
  return (
    <div>
      <PageHeader
        title="Import from a document"
        subtitle="Turn an existing PDF or Word quote/invoice into a live record with AI."
      />
      <ImportDocument />
    </div>
  );
}
