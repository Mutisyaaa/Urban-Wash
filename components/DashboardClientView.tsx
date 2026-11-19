"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatKsh } from "@/lib/pricing";
import { OrdersTable } from "@/components/OrdersTable";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import type { OrderWithItems } from "@/lib/types/orders";

export function DashboardClientView({
  userId,
  initialOrders,
  showSummaryCards = true,
  showFilterTabs = false,
  title = "Dashboard",
}: {
  userId: string;
  initialOrders: OrderWithItems[];
  showSummaryCards?: boolean;
  showFilterTabs?: boolean;
  title?: string;
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
    null
  );
  const [filterTab, setFilterTab] = useState<
    "all" | "in_progress" | "delivered" | "cancelled"
  >("all");

  const reloadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data as unknown as OrderWithItems[]);
    }
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          reloadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reloadOrders, userId]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const inProgress = orders.filter((o) =>
      [
        "order_placed",
        "picked_up",
        "in_cleaning",
        "out_for_delivery",
      ].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + Number(o.total_amount), 0);

    return { totalOrders, inProgress, delivered, totalSpent };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const base =
      filterTab === "all"
        ? orders
        : filterTab === "in_progress"
        ? orders.filter((o) =>
            [
              "order_placed",
              "picked_up",
              "in_cleaning",
              "out_for_delivery",
            ].includes(o.status)
          )
        : filterTab === "delivered"
        ? orders.filter((o) => o.status === "delivered")
        : orders.filter((o) => o.status === "cancelled");

    return showFilterTabs ? base : base.slice(0, 8);
  }, [orders, filterTab, showFilterTabs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live order activity and pickup status updates.
          </p>
        </div>

        <Link
          href="/booking"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B75FF] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-[#145FD6]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Booking
        </Link>
      </div>

      {showSummaryCards && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Orders
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1B75FF]">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#0B1F3A]">
              {stats.totalOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                In Progress
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#0B1F3A]">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Delivered
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#0B1F3A]">
              {stats.delivered}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Spent
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#1B75FF]">
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-[#0B1F3A]">
              {formatKsh(stats.totalSpent)}
            </p>
          </div>
        </div>
      )}

      {showFilterTabs && (
        <div
          role="tablist"
          aria-label="Filter orders by status"
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5"
        >
          {[
            { id: "all", label: "All" },
            { id: "in_progress", label: "In Progress" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filterTab === tab.id}
              onClick={() =>
                setFilterTab(
                  tab.id as "all" | "in_progress" | "delivered" | "cancelled"
                )
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filterTab === tab.id
                  ? "bg-[#1B75FF] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">
            {showFilterTabs ? "Order History" : "Recent Orders"}
          </h2>
          {!showFilterTabs && (
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#1B75FF] hover:underline"
            >
              View All
            </Link>
          )}
        </div>

        <OrdersTable
          orders={filteredOrders}
          caption="Customer laundry bookings"
          onSelectOrder={setSelectedOrder}
        />

        {orders.length === 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/booking"
              className="inline-flex rounded-xl bg-[#1B75FF] px-5 py-2.5 text-xs font-bold text-white"
            >
              Book Your First Pickup
            </Link>
          </div>
        )}
      </section>

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={reloadOrders}
      />
    </div>
  );
}
