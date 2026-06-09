"use client";

import { SidebarNav, type NavItem } from "@/components/SidebarNav";

const nav: Array<NavItem & { adminOnly?: boolean }> = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/clients", label: "Clients" },
  { href: "/contractors", label: "Contractors" },
  { href: "/invoices", label: "Invoices & quotes" },
  { href: "/settings", label: "Settings", adminOnly: true },
];

export function Sidebar({
  userName,
  userEmail,
  isAdmin,
  signOut,
  signOutEverywhere,
}: {
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
}) {
  const items = nav.filter((item) => isAdmin || !item.adminOnly);

  return (
    <SidebarNav
      brandTitle="Homefix Renovations"
      brandSubtitle="Leatherhead, Surrey"
      items={items}
      userName={userName}
      userEmail={userEmail}
      signOut={signOut}
      signOutEverywhere={signOutEverywhere}
    />
  );
}
