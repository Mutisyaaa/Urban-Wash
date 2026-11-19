import type { OrderItemRow, OrderRow } from "@/lib/types/database";

export type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
};
