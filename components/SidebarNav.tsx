"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string };

function isActive(pathname: string, href: string) {
  // Treat the section roots as exact matches so they don't stay highlighted
  // on every child route.
  if (href === "/" || href === "/my") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Responsive app navigation. On large screens it renders the familiar static
 * sidebar; on small screens it collapses to a top bar with a slide-in drawer.
 * The desktop markup is intentionally unchanged so the web layout is identical.
 */
export function SidebarNav({
  brandTitle,
  brandSubtitle,
  items,
  userName,
  userEmail,
  signOut,
  signOutEverywhere,
}: {
  brandTitle: string;
  brandSubtitle: string;
  items: NavItem[];
  userName: string;
  userEmail: string;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        HF
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-900">{brandTitle}</div>
        <div className="text-xs text-slate-400">{brandSubtitle}</div>
      </div>
    </div>
  );

  const navLinks = (
    <nav className="flex-1 space-y-1 px-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
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
  );

  const footer = (
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
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            HF
          </span>
          <span className="text-sm font-semibold text-slate-900">{brandTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="m-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {navLinks}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar (unchanged on web) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {navLinks}
        {footer}
      </aside>
    </>
  );
}
