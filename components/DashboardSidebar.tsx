"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarPlus,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/types/database";

export function DashboardSidebar({
  profile,
  unreadCount,
}: {
  profile: ProfileRow;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName =
    profile.full_name?.trim().split(/\s+/)[0] ||
    profile.email.split("@")[0] ||
    "Customer";

  const roleLabel =
    profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/booking", label: "New Booking", icon: CalendarPlus },
    { href: "/dashboard/orders", label: "My Orders", icon: ClipboardList },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount,
    },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1F3A] text-white p-5">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="focus-visible:outline-2 focus-visible:outline-white rounded-lg">
            <BrandLogo variant="light" compact showTagline={false} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* User greeting card matching blueprint */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#38BDF8] to-[#1B75FF] text-base font-extrabold text-white">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              Hello, {firstName}
            </p>
            <p className="text-xs font-medium text-sky-300">{roleLabel}</p>
          </div>
        </div>

        <nav aria-label="Dashboard navigation" className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[#1B75FF] text-white shadow-md shadow-blue-950/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[11px] font-extrabold text-[#0B1F3A]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {profile.role === "admin" && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500 text-[#0B1F3A]"
                  : "border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
              }`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="space-y-1.5 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Public Website</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-0 h-dvh">{sidebarContent}</div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B1F3A] px-4 py-3 text-white lg:hidden">
        <Link href="/">
          <BrandLogo variant="light" compact showTagline={false} />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-bold"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          Menu
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 max-w-[85dvw] h-full shadow-2xl">
            {sidebarContent}
          </div>
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-slate-950/60 backdrop-blur-xs"
          />
        </div>
      )}
    </>
  );
}
