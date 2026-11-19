"use client";

import React, { useId } from "react";
import {
  formatKsh,
  formatOrderDate,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/pricing";
import type { OrderWithItems } from "@/lib/types/orders";

export function OrdersTable({
  orders,
  caption = "Urban Wash orders",
  onSelectOrder,
}: {
  orders: OrderWithItems[];
  caption?: string;
  onSelectOrder: (order: OrderWithItems) => void;
}) {
  const captionId = useId();

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">
          No orders match this view yet.
        </p>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className="table-wrapper"
    >
      <table
        className="uw-table"
        style={
          {
            "--label-2": '"Service"',
            "--label-3": '"Date"',
            "--label-4": '"Status"',
            "--label-5": '"Total"',
            "--label-6": '"Action"',
          } as React.CSSProperties
        }
      >
        <caption id={captionId} className="visually-hidden">
          {caption}
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Service</th>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
            <th scope="col">Total</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const firstItem = order.order_items[0];
            const serviceDisplay = firstItem
              ? `${firstItem.service_name} (${firstItem.quantity}${firstItem.unit_label})`
              : "Laundry Service";
            const statusMeta =
              ORDER_STATUS_META[
                (order.status as OrderStatus) ?? "order_placed"
              ] ?? ORDER_STATUS_META.order_placed;

            return (
              <tr key={order.id}>
                <th scope="row">{order.order_code}</th>
                <td>{serviceDisplay}</td>
                <td>{formatOrderDate(order.pickup_date)}</td>
                <td>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
                  >
                    {statusMeta.label}
                  </span>
                </td>
                <td className="font-bold text-[#0B1F3A]">
                  {formatKsh(order.total_amount)}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1B75FF] transition hover:border-[#1B75FF] hover:bg-blue-50"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
