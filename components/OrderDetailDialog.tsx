"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Phone, Truck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatKsh,
  formatOrderDate,
  formatOrderTimestamp,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/pricing";
import type { OrderWithItems } from "@/lib/types/orders";

export function OrderDetailDialog({
  order,
  onClose,
  onOrderUpdated,
  allowCancel = true,
}: {
  order: OrderWithItems | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
  allowCancel?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (order) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [order]);

  const handleClose = () => {
    setErrorMsg(null);
    onClose();
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      if (error) {
        setErrorMsg(error.message);
        return;
      }
      onOrderUpdated?.();
      handleClose();
    } finally {
      setCancelling(false);
    }
  };

  if (!order) {
    return <dialog ref={dialogRef} className="uw-dialog" />;
  }

  const statusMeta =
    ORDER_STATUS_META[(order.status as OrderStatus) ?? "order_placed"] ??
    ORDER_STATUS_META.order_placed;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      aria-labelledby="order-dialog-title"
      className="uw-dialog bg-white text-slate-900"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                id="order-dialog-title"
                className="text-xl font-extrabold text-[#0B1F3A]"
              >
                Order {order.order_code}
              </h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Placed {formatOrderTimestamp(order.placed_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close order details"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
          >
            {errorMsg}
          </div>
        )}

        <div className="grid gap-3 rounded-2xl bg-[#F5F8FC] p-4 text-xs sm:grid-cols-2">
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-slate-400">
              Pickup Schedule
            </span>
            <p className="font-semibold text-slate-800">
              {formatOrderDate(order.pickup_date)}
            </p>
            <p className="text-slate-600">{order.pickup_time_slot}</p>
          </div>

          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-slate-400">
              Payment
            </span>
            <p className="font-semibold text-slate-800 uppercase">
              {order.payment_method.replace(/_/g, " ")} •{" "}
              <span
                className={
                  order.payment_status === "paid"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }
              >
                {order.payment_status}
              </span>
            </p>
            {order.mpesa_reference && (
              <p className="text-slate-500">Ref: {order.mpesa_reference}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1 border-t border-slate-200/70 pt-2.5">
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-[#1B75FF]" aria-hidden="true" />
              {order.pickup_address}
            </p>
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              <Phone className="h-3.5 w-3.5 text-[#1B75FF]" aria-hidden="true" />
              {order.customer_name} ({order.customer_phone})
            </p>
            {order.special_instructions && (
              <p className="text-slate-600 italic">
                &ldquo;{order.special_instructions}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Items Breakdown
          </h3>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {item.service_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.variant_label ? `${item.variant_label} • ` : ""}
                    {item.quantity} {item.unit_label} ×{" "}
                    {formatKsh(item.unit_price)}
                  </p>
                </div>
                <span className="font-bold text-[#0B1F3A]">
                  {formatKsh(item.line_total)}
                </span>
              </li>
            ))}
            {Number(order.discount_amount) > 0 && (
              <li className="flex items-center justify-between bg-emerald-50/50 px-4 py-2 text-xs font-bold text-emerald-700">
                <span>Bulk Discount</span>
                <span>-{formatKsh(order.discount_amount)}</span>
              </li>
            )}
            <li className="flex items-center justify-between bg-slate-50 px-4 py-3 font-extrabold text-[#0B1F3A]">
              <span>Total</span>
              <span className="text-[#1B75FF]">
                {formatKsh(order.total_amount)}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {allowCancel && order.status === "order_placed" ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelOrder}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              {cancelling && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              Cancel Order
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <Link
              href={`/track?code=${encodeURIComponent(order.order_code)}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B75FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#145FD6]"
            >
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Live Track
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
