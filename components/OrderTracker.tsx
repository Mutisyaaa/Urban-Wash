"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  WashingMachine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatKsh,
  formatOrderTimestamp,
  ORDER_STAGES,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/pricing";

export interface TrackedOrder {
  order_code: string;
  status: OrderStatus;
  pickup_date: string;
  pickup_time_slot: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  placed_at: string | null;
  picked_up_at: string | null;
  in_cleaning_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  items: Array<{
    service_name: string;
    variant_label: string | null;
    quantity: number;
    unit_label: string;
    line_total: number;
  }>;
}

const DEMO_CODES = ["UW12345", "UW12344", "UW12343"];

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order_placed: ClipboardCheck,
  picked_up: PackageCheck,
  in_cleaning: WashingMachine,
  out_for_delivery: Truck,
  delivered: Sparkles,
};

export function OrderTracker({
  initialCode,
  initialOrder,
}: {
  initialCode: string;
  initialOrder: TrackedOrder | null;
}) {
  const [queryCode, setQueryCode] = useState<string>(initialCode);
  const [order, setOrder] = useState<TrackedOrder | null>(initialOrder);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  const fetchOrder = useCallback(async (codeToFetch: string) => {
    const normalized = codeToFetch.trim().toUpperCase();
    if (!normalized) return;

    setLoading(true);
    setNotFound(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("track_order_by_code", {
        p_order_code: normalized,
      });

      if (error) {
        setOrder(null);
        setNotFound(true);
      } else if (!data) {
        setOrder(null);
        setNotFound(true);
      } else {
        setOrder(data as unknown as TrackedOrder);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("track-order-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as { order_code?: string };
          if (
            updated?.order_code &&
            order?.order_code &&
            updated.order_code.toUpperCase() === order.order_code.toUpperCase()
          ) {
            fetchOrder(order.order_code);
          }
        }
      )
      .subscribe();

    const handleFocus = () => {
      if (order?.order_code) {
        fetchOrder(order.order_code);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, [fetchOrder, order?.order_code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(queryCode);
  };

  const activeStageIndex = order
    ? ORDER_STAGES.findIndex((s) => s.key === order.status)
    : -1;

  const statusMeta = order
    ? ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.order_placed
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Enter your order number to see the latest status.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="track-order-code" className="visually-hidden">
            Order number
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="track-order-code"
              type="text"
              required
              spellCheck={false}
              placeholder="Enter order number e.g. UW12345"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              className="uw-input pl-11 py-3 font-semibold uppercase tracking-wide"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B75FF] px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#145FD6] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Track"
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Quick demo orders:</span>
          {DEMO_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setQueryCode(code);
                fetchOrder(code);
              }}
              className={`rounded-full px-3 py-1 font-bold transition ${
                order?.order_code === code
                  ? "bg-[#0B1F3A] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1B75FF]"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {notFound && (
        <div
          role="status"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"
        >
          <h2 className="text-lg font-extrabold text-amber-900">
            Order &ldquo;{queryCode.trim().toUpperCase()}&rdquo; not found
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Double-check your Urban Wash order code (for example{" "}
            <button
              type="button"
              onClick={() => {
                setQueryCode("UW12345");
                fetchOrder("UW12345");
              }}
              className="font-bold underline"
            >
              UW12345
            </button>
            ) or sign in to view your bookings.
          </p>
        </div>
      )}

      {order && statusMeta && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-extrabold text-[#0B1F3A]">
                  {order.order_code}
                </span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Pickup: {order.pickup_date} ({order.pickup_time_slot}) •{" "}
                {formatKsh(order.total_amount)} (
                {order.payment_status === "paid" ? "Paid" : "Pay on Delivery"})
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchOrder(order.order_code)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh Status
            </button>
          </div>

          {order.status === "cancelled" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="font-bold text-rose-800">{statusMeta.bannerTitle}</p>
              <p className="mt-1 text-sm text-rose-700">
                {statusMeta.bannerSubtitle}
              </p>
              <Link
                href="/booking"
                className="mt-4 inline-flex rounded-xl bg-[#1B75FF] px-5 py-2.5 text-xs font-bold text-white"
              >
                Book New Pickup
              </Link>
            </div>
          ) : (
            /* 5-Stage Progress Timeline matching blueprint */
            <ol className="grid gap-6 md:grid-cols-5 md:gap-3">
              {ORDER_STAGES.map((stage, idx) => {
                const isCompleted = activeStageIndex > idx || order.status === "delivered";
                const isCurrent = activeStageIndex === idx && order.status !== "delivered";
                const StageIcon = STAGE_ICONS[stage.key] ?? ClipboardCheck;
                const ts = order[stage.timestampField];

                return (
                  <li
                    key={stage.key}
                    className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
                  >
                    {idx > 0 && (
                      <span
                        aria-hidden="true"
                        className={`hidden md:block absolute top-5 -left-1/2 h-0.5 w-full ${
                          idx <= activeStageIndex ? "bg-[#1B75FF]" : "bg-slate-200"
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                        isCompleted
                          ? "bg-[#1B75FF] text-white shadow-sm"
                          : isCurrent
                          ? "bg-[#1B75FF] text-white ring-4 ring-blue-100"
                          : "border-2 border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <StageIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isCompleted || isCurrent
                            ? "text-[#0B1F3A]"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {ts ? formatOrderTimestamp(ts) : "Pending"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Itemized Summary */}
          {order.items?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Services Included
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {order.items.map((item, idx) => (
                  <li
                    key={`${item.service_name}-${idx}`}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">
                      {item.service_name}
                      {item.variant_label ? ` (${item.variant_label})` : ""} ×{" "}
                      {item.quantity} {item.unit_label}
                    </span>
                    <span className="font-bold text-[#0B1F3A]">
                      {formatKsh(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blueprint Bottom Callout Banner with Delivery Van Illustration */}
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-[#EEF5FF] p-6 sm:flex-row">
            <div>
              <p className="text-base font-extrabold text-[#0B1F3A]">
                {statusMeta.bannerTitle}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {statusMeta.bannerSubtitle}
              </p>
            </div>

            <svg
              viewBox="0 0 180 96"
              fill="none"
              aria-hidden="true"
              className="h-20 w-36 shrink-0"
            >
              <rect
                x="14"
                y="22"
                width="98"
                height="52"
                rx="10"
                fill="#1B75FF"
              />
              <path
                d="M112 36H144L162 54V74H112V36Z"
                fill="#0B1F3A"
              />
              <path
                d="M120 42H140L152 54H120V42Z"
                fill="#BAE6FD"
              />
              <circle cx="48" cy="76" r="12" fill="#0F172A" />
              <circle cx="48" cy="76" r="5" fill="#E2E8F0" />
              <circle cx="136" cy="76" r="12" fill="#0F172A" />
              <circle cx="136" cy="76" r="5" fill="#E2E8F0" />
              <path
                d="M62 35C62 35 55 43 55 49C55 52.87 58.13 56 62 56C65.87 56 69 52.87 69 49C69 43 62 35 62 35Z"
                fill="#38BDF8"
              />
              <rect x="2" y="66" width="12" height="3" rx="1.5" fill="#93C5FD" />
              <rect x="6" y="56" width="8" height="3" rx="1.5" fill="#93C5FD" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
