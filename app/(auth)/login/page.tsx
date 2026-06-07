import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { BrandLogo, LogoLockup } from "@/components/Logo";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <BrandLogo imgClassName="mx-auto h-16 w-auto" fallback={<LogoLockup />} />
          </div>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo login: admin@homefixlimited.co.uk / password123
        </p>
      </div>
    </main>
  );
}
