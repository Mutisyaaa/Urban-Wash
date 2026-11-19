import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsFeed } from "@/components/NotificationsFeed";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function DashboardNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/notifications");
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <NotificationsFeed
      userId={user.id}
      initialNotifications={data ?? []}
    />
  );
}
