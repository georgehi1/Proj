import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { currentUser, isAdmin } from "@/lib/session";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  if (!isAdmin(await currentUser())) redirect("/");
  const settings = await prisma.companySettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company details used across the app." />
      <SettingsForm
        defaults={{
          companyName: settings?.companyName ?? "Homefix Renovations",
          addressLine1: settings?.addressLine1 ?? "",
          addressLine2: settings?.addressLine2 ?? "",
          town: settings?.town ?? "",
          postcode: settings?.postcode ?? "",
          phone: settings?.phone ?? "",
          email: settings?.email ?? "",
          vatNumber: settings?.vatNumber ?? "",
          defaultVatRate: settings ? Number(settings.defaultVatRate) : 20,
          invoicePrefix: settings?.invoicePrefix ?? "INV",
          quotePrefix: settings?.quotePrefix ?? "QUO",
        }}
      />
    </div>
  );
}
