import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Contractors get a confined portal; keep them out of the office app.
  if (session.user.role === "CONTRACTOR") redirect("/my");

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
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        isAdmin={session.user.role === "ADMIN"}
        signOut={handleSignOut}
        signOutEverywhere={handleSignOutEverywhere}
      />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
