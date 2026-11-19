import type { ServiceRow } from "@/lib/types/database";

export type DuvetSize = "3x6" | "4x6" | "5x6";

export type OrderStatus =
  | "order_placed"
  | "picked_up"
  | "in_cleaning"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const DUVET_PRICES: Record<DuvetSize, number> = {
  "3x6": 500,
  "4x6": 700,
  "5x6": 900,
};

export const PICKUP_TIME_SLOTS = [
  "08:00 AM - 11:00 AM",
  "11:00 AM - 02:00 PM",
  "02:00 PM - 05:00 PM",
  "05:00 PM - 08:00 PM",
] as const;

export const ORDER_STAGES: Array<{
  key: Exclude<OrderStatus, "cancelled">;
  label: string;
  shortLabel: string;
  description: string;
  timestampField:
    | "placed_at"
    | "picked_up_at"
    | "in_cleaning_at"
    | "out_for_delivery_at"
    | "delivered_at";
}> = [
  {
    key: "order_placed",
    label: "Order Placed",
    shortLabel: "Placed",
    description:
      "We've received your booking and assigned a pickup rider in your area.",
    timestampField: "placed_at",
  },
  {
    key: "picked_up",
    label: "Picked Up",
    shortLabel: "Picked Up",
    description:
      "Your laundry has been collected and is on its way to our cleaning hub.",
    timestampField: "picked_up_at",
  },
  {
    key: "in_cleaning",
    label: "In Cleaning",
    shortLabel: "In Cleaning",
    description:
      "Your clothes are being cleaned with care! We'll notify you once it's out for delivery.",
    timestampField: "in_cleaning_at",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    shortLabel: "Delivering",
    description:
      "Fresh, crisp, and neatly folded! Our rider is heading to your doorstep.",
    timestampField: "out_for_delivery_at",
  },
  {
    key: "delivered",
    label: "Delivered",
    shortLabel: "Delivered",
    description:
      "Delivered safely to your door. Clean. Fresh. Delivered — enjoy!",
    timestampField: "delivered_at",
  },
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    badgeClass: string;
    bannerTitle: string;
    bannerSubtitle: string;
  }
> = {
  order_placed: {
    label: "Order Placed",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    bannerTitle: "Your booking is confirmed!",
    bannerSubtitle:
      "A rider will arrive at your chosen pickup window. Free pickup & delivery!",
  },
  picked_up: {
    label: "Picked Up",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    bannerTitle: "Your laundry has been picked up!",
    bannerSubtitle:
      "En route to our cleaning facility for sorting and fabric care.",
  },
  in_cleaning: {
    label: "In Cleaning",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    bannerTitle: "Your clothes are being cleaned with care!",
    bannerSubtitle: "We'll notify you once it's out for delivery.",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    bannerTitle: "Your fresh laundry is on the way!",
    bannerSubtitle: "Our delivery rider is heading straight to your address.",
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bannerTitle: "Your order has been delivered!",
    bannerSubtitle:
      "Fresh clothes, happy you. Thank you for trusting Urban Wash!",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    bannerTitle: "This order was cancelled.",
    bannerSubtitle:
      "Need a new pickup? Book another collection in under 60 seconds.",
  },
};

export interface PricingCalculation {
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  regularLineTotal: number;
  actualLineTotal: number;
  addonTotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  discountApplied: boolean;
  variantLabel: string | null;
}

export function calculateOrderPricing(params: {
  service: ServiceRow;
  quantity: number;
  duvetSize?: DuvetSize;
  addStainRemoval?: boolean;
  stainRemovalPrice?: number;
}): PricingCalculation {
  const qty = Math.max(0, Number.isFinite(params.quantity) ? params.quantity : 0);
  const { service, duvetSize = "4x6", addStainRemoval = false, stainRemovalPrice = 200 } =
    params;

  let baseUnitPrice = Number(service.unit_price);
  let effectiveUnitPrice = Number(service.unit_price);
  let discountApplied = false;
  let variantLabel: string | null = null;

  if (service.slug === "duvet-wash-dry") {
    const duvetPrice = DUVET_PRICES[duvetSize] ?? 700;
    baseUnitPrice = duvetPrice;
    effectiveUnitPrice = duvetPrice;
    variantLabel = `${duvetSize} Duvet`;
  } else if (
    service.bulk_threshold !== null &&
    service.bulk_unit_price !== null &&
    qty >= Number(service.bulk_threshold)
  ) {
    effectiveUnitPrice = Number(service.bulk_unit_price);
    discountApplied = effectiveUnitPrice < baseUnitPrice;
    variantLabel = `${service.bulk_threshold}${service.pricing_unit}+ Bulk Rate`;
  }

  const regularLineTotal = Math.round(baseUnitPrice * qty * 100) / 100;
  const actualLineTotal = Math.round(effectiveUnitPrice * qty * 100) / 100;
  const discountAmount = Math.max(
    0,
    Math.round((regularLineTotal - actualLineTotal) * 100) / 100
  );
  const addonTotal =
    addStainRemoval && service.slug !== "stain-removal" ? stainRemovalPrice : 0;

  const subtotal = Math.round((regularLineTotal + addonTotal) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;

  return {
    baseUnitPrice,
    effectiveUnitPrice,
    regularLineTotal,
    actualLineTotal,
    addonTotal,
    subtotal,
    discountAmount,
    total,
    discountApplied,
    variantLabel,
  };
}

export function formatKsh(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  return `KSh ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(Math.round(safeNum))}`;
}

export function formatOrderTimestamp(iso: string | null | undefined): string {
  if (!iso) return "Pending";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatOrderDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
