import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AdminConsole } from "@/components/AdminConsole";
import type { ProfileRow } from "@/lib/types/database";
import type { OrderWithItems } from "@/lib/types/orders";

export const metadata: Metadata = {
  title: "Admin Console",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const [{ data: profileData }, { count }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  const profile: ProfileRow = profileData ?? {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? "",
    email: user.email ?? "",
    phone: null,
    default_address: null,
    role: "customer",
    avatar_url: null,
    email_notifications: true,
    sms_notifications: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (profile.role !== "admin") {
    return (
      <div className="flex min-h-dvh flex-col bg-[#F5F8FC] lg:flex-row">
        <DashboardSidebar profile={profile} unreadCount={count ?? 0} />
        <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">
              Admin Access Required
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your account (<strong>{profile.email}</strong>) currently has the{" "}
              <strong>{profile.role}</strong> role. Role elevation is enforced
              by Postgres RLS and triggers.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-left text-xs font-mono text-sky-200 overflow-x-auto">
              UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;
              {profile.email}&apos;;
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Run the SQL above in your Supabase SQL Editor, then refresh this
              page.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white hover:bg-[#145FD6]"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [{ data: ordersData }, { data: servicesData }, { data: profilesData }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F8FC] lg:flex-row">
      <DashboardSidebar profile={profile} unreadCount={count ?? 0} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <AdminConsole
          initialOrders={(ordersData ?? []) as unknown as OrderWithItems[]}
          initialServices={servicesData ?? []}
          initialProfiles={profilesData ?? []}
        />
      </main>
    </div>
  );
}
