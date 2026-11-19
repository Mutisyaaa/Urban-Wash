import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import type { ProfileRow } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
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
    phone: (user.user_metadata?.phone as string) ?? null,
    default_address: null,
    role: "customer",
    avatar_url: null,
    email_notifications: true,
    sms_notifications: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F8FC] lg:flex-row">
      <DashboardSidebar profile={profile} unreadCount={count ?? 0} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
