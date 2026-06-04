"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/my", label: "Dashboard" },
  { href: "/my/jobs", label: "My jobs" },
  { href: "/my/availability", label: "My availability" },
];

function isActive(pathname: string, href: string) {
  if (href === "/my") return pathname === "/my";
  return pathname === href || pathname.startsWith(href + "/");
}

export function ContractorSidebar({
  userName,
  userEmail,
  signOut,
  signOutEverywhere,
}: {
  userName: string;
  userEmail: string;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          HF
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">Homefix</div>
          <div className="text-xs text-slate-400">Contractor portal</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, item.href)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-4 py-4">
        <div className="mb-2 truncate text-sm font-medium text-slate-800">{userName}</div>
        <div className="mb-3 truncate text-xs text-slate-400">{userEmail}</div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
        <form action={signOutEverywhere} className="mt-2">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
            title="Ends every session for your account on all devices"
          >
            Sign out of all devices
          </button>
        </form>
      </div>
    </aside>
  );
}
