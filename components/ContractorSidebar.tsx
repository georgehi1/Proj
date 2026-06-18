"use client";

import { SidebarNav, type NavItem } from "@/components/SidebarNav";

const nav: NavItem[] = [
  { href: "/my", label: "Dashboard" },
  { href: "/my/jobs", label: "My jobs" },
  { href: "/my/availability", label: "My availability" },
];

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
  return (
    <SidebarNav
      brandTitle="Homefix Renovations"
      brandSubtitle="Contractor portal"
      items={nav}
      userName={userName}
      userEmail={userEmail}
      signOut={signOut}
      signOutEverywhere={signOutEverywhere}
    />
  );
}
