"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NavbarClient } from "@/components/NavbarClient";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { ProfileRow } from "@/lib/types/database";

export function SiteChrome({
  initialProfile,
  initialUnreadCount,
  children,
}: {
  initialProfile: ProfileRow | null;
  initialUnreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWorkspaceShell =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <>
      {!isWorkspaceShell && (
        <NavbarClient
          key={`${initialProfile?.id ?? "anon"}-${initialUnreadCount}`}
          initialProfile={initialProfile}
          initialUnreadCount={initialUnreadCount}
        />
      )}
      <div className={`flex-1 flex flex-col ${!isWorkspaceShell ? "pb-16 md:pb-0" : "pb-16 md:pb-0"}`}>
        {children}
      </div>
      {!isWorkspaceShell && <Footer />}
      <MobileBottomNav />
    </>
  );
}
