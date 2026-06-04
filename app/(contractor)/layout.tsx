import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContractorSidebar } from "@/components/ContractorSidebar";

export default async function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // This area is contractors-only; office staff are sent back to the app.
  if (session.user.role !== "CONTRACTOR") redirect("/");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  // Bumping tokenVersion invalidates every existing session for this account.
  async function handleSignOutEverywhere() {
    "use server";
    const s = await auth();
    if (s?.user?.id) {
      await prisma.user.update({
        where: { id: s.user.id },
        data: { tokenVersion: { increment: 1 } },
      });
    }
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <ContractorSidebar
        userName={session.user.name ?? "Contractor"}
        userEmail={session.user.email ?? ""}
        signOut={handleSignOut}
        signOutEverywhere={handleSignOutEverywhere}
      />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
