import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrderTracker, type TrackedOrder } from "@/components/OrderTracker";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Urban Wash laundry pickup, cleaning, and delivery status in real time.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const initialCode = (params.code || "UW12345").trim().toUpperCase();

  let initialOrder: TrackedOrder | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("track_order_by_code", {
      p_order_code: initialCode,
    });
    if (data) {
      initialOrder = data as unknown as TrackedOrder;
    }
  } catch {
    // Allow interactive fallback
  }

  return (
    <main className="flex-1 bg-[#F5F8FC] py-10 px-4 sm:px-6 lg:px-8">
      <OrderTracker initialCode={initialCode} initialOrder={initialOrder} />
    </main>
  );
}
