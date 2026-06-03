import { PageHeader } from "@/components/ui";
import { ContractorForm } from "../ContractorForm";

export default function NewContractorPage() {
  return (
    <div>
      <PageHeader title="New contractor" />
      <ContractorForm />
    </div>
  );
}
