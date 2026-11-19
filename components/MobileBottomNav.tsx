"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, ClipboardList, Home, User } from "lucide-react";

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/booking", label: "Book", icon: CalendarPlus },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {MOBILE_TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active
                    ? "text-[#1B75FF] border-t-2 border-[#1B75FF] bg-blue-50/40"
                    : "text-slate-500 border-t-2 border-transparent hover:text-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
