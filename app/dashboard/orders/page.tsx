import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClientView } from "@/components/DashboardClientView";
import type { OrderWithItems } from "@/lib/types/orders";

export const metadata: Metadata = {
  title: "My Orders",
};

export default async function DashboardOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/orders");
  }

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderWithItems[];

  return (
    <DashboardClientView
      userId={user.id}
      initialOrders={orders}
      showSummaryCards={false}
      showFilterTabs
      title="My Orders"
    />
  );
}
