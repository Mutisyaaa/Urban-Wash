"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/types/database";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/track", label: "Track Order" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function NavbarClient({
  initialProfile,
  initialUnreadCount,
}: {
  initialProfile: ProfileRow | null;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const prevWidthRef = useRef<number>(0);

  const [isWide, setIsWide] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null);
        setUnreadCount(0);
        return;
      }
      const [{ data: nextProfile }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("is_read", false),
      ]);
      setProfile(nextProfile);
      setUnreadCount(count ?? 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Feature-detect native Popover API before conditionally loading polyfill
    if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
      import("@oddbird/popover-polyfill").catch(() => undefined);
    }

    const header = headerRef.current;
    const inner = innerRef.current;
    const menu = menuRef.current;
    if (!header || !inner || !menu) return;

    let rafId = 0;

    const measure = () => {
      const currentWidth = header.clientWidth;
      const wasOpen =
        menu.matches(":popover-open") || menu.classList.contains(":popover-open");

      header.classList.add("is-measuring");
      header.classList.add("is-wide");
      menu.removeAttribute("popover");

      const fits = inner.scrollWidth <= inner.clientWidth + 2;

      if (fits) {
        setIsWide(true);
        header.classList.add("is-wide");
        menu.removeAttribute("popover");
      } else {
        setIsWide(false);
        header.classList.remove("is-wide");
        menu.setAttribute("popover", "auto");
        if (wasOpen) {
          try {
            menu.showPopover();
          } catch {
            // Polyfill or state guard
          }
        }
      }

      prevWidthRef.current = currentWidth;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        header.classList.remove("is-measuring");
      });
    };

    const observer = new ResizeObserver(() => {
      const width = header.clientWidth;
      const isCurrentlyWide = header.classList.contains("is-wide");
      if (isCurrentlyWide || width > prevWidthRef.current || prevWidthRef.current === 0) {
        measure();
      }
      prevWidthRef.current = width;
    });

    measure();
    observer.observe(header);
    observer.observe(menu);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [profile]);

  const closeMenuPopover = () => {
    const menu = menuRef.current;
    if (!menu) return;
    if (menu.hasAttribute("popover")) {
      try {
        menu.hidePopover();
      } catch {
        // Ignore if already closed
      }
    }
  };

  const handleLogout = async () => {
    closeMenuPopover();
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    setUnreadCount(0);
    router.push("/");
    router.refresh();
  };

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      ref={headerRef}
      className={`site-header ${isWide ? "is-wide" : ""}`}
    >
      <div ref={innerRef} className="header-inner">
        <Link
          href="/"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B75FF] rounded-lg"
          aria-label="Urban Wash Home"
        >
          <BrandLogo compact />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <button
            className="menu-button"
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="toggle"
            aria-controls="site-menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span>Menu</span>
          </button>

          <ul id="site-menu" ref={menuRef} className="site-menu">
            <li className="mobile-only-actions flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </span>
              <button
                type="button"
                popoverTarget="site-menu"
                popoverTargetAction="hide"
                aria-label="Close menu"
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>

            {NAV_ITEMS.map((item) => {
              const active = isActiveLink(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="nav-link w-full"
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenuPopover}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="mobile-only-actions pt-2 mt-1 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/booking"
                onClick={closeMenuPopover}
                className="inline-flex justify-center items-center rounded-xl bg-[#1B75FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#145FD6]"
              >
                Book Now
              </Link>
              {profile ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenuPopover}
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#1B75FF] px-2 py-0.5 text-[11px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={closeMenuPopover}
                      className="inline-flex justify-center items-center gap-2 rounded-xl bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={closeMenuPopover}
                    className="inline-flex justify-center items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0B1F3A]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenuPopover}
                    className="inline-flex justify-center items-center rounded-xl bg-[#0B1F3A] px-3 py-2 text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {profile ? (
            <>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B75FF] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-[#145FD6]"
              >
                Book Now
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                <LayoutDashboard className="h-4 w-4 text-[#1B75FF]" aria-hidden="true" />
                <span>Dashboard</span>
                {unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1B75FF] px-1.5 text-[11px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              {profile.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#102A4C]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-[#1B75FF] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#145FD6]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
