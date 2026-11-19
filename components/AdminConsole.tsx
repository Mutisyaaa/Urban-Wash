"use client";

import React, { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatKsh,
  formatOrderDate,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/pricing";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import type { ProfileRow, ServiceRow } from "@/lib/types/database";
import type { OrderWithItems } from "@/lib/types/orders";

type AdminTab = "orders" | "services" | "users" | "notify";

export function AdminConsole({
  initialOrders,
  initialServices,
  initialProfiles,
}: {
  initialOrders: OrderWithItems[];
  initialServices: ServiceRow[];
  initialProfiles: ProfileRow[];
}) {
  const router = useRouter();
  const ordersCaptionId = useId();
  const usersCaptionId = useId();

  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add service form state
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newUnit, setNewUnit] = useState<"kg" | "item" | "set" | "pair" | "flat">(
    "item"
  );
  const [newPrice, setNewPrice] = useState("500");
  const [newPriceLabel, setNewPriceLabel] = useState("KSh 500");
  const [newSubtitle, setNewSubtitle] = useState("per item");
  const [newDescription, setNewDescription] = useState("");

  // Send notification state
  const [notifyUserId, setNotifyUserId] = useState<string>(
    initialProfiles[0]?.id ?? ""
  );
  const [notifyOrderId, setNotifyOrderId] = useState<string>("");
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");

  const showSuccess = (msg: string) => {
    setErrorMsg(null);
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const riders = useMemo(
    () => profiles.filter((p) => p.role === "rider" || p.role === "admin"),
    [profiles]
  );

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q) ||
        o.pickup_address.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const reloadAll = async () => {
    const supabase = createClient();
    const [{ data: oData }, { data: sData }, { data: pData }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (oData) setOrders(oData as unknown as OrderWithItems[]);
    if (sData) setServices(sData);
    if (pData) setProfiles(pData);
    router.refresh();
  };

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    setBusyId(`order-${orderId}`);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await reloadAll();
      showSuccess(`Order status updated to ${ORDER_STATUS_META[status].label}.`);
    } finally {
      setBusyId(null);
    }
  };

  const assignRider = async (orderId: number, riderId: string) => {
    setBusyId(`rider-${orderId}`);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ rider_id: riderId || null })
        .eq("id", orderId);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await reloadAll();
      showSuccess("Rider assignment saved.");
    } finally {
      setBusyId(null);
    }
  };

  const togglePaymentPaid = async (order: OrderWithItems) => {
    const nextStatus = order.payment_status === "paid" ? "pending" : "paid";
    setBusyId(`pay-${order.id}`);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: nextStatus })
        .eq("id", order.id);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await reloadAll();
      showSuccess(`Payment marked ${nextStatus}.`);
    } finally {
      setBusyId(null);
    }
  };

  const updateService = async (service: ServiceRow) => {
    setBusyId(`svc-${service.id}`);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("services")
        .update({
          unit_price: service.unit_price,
          bulk_threshold: service.bulk_threshold,
          bulk_unit_price: service.bulk_unit_price,
          price_label: service.price_label,
          subtitle: service.subtitle,
          is_active: service.is_active,
        })
        .eq("id", service.id);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      showSuccess(`Saved changes to ${service.name}.`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId("new-svc");
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const slug =
        newSlug.trim() ||
        newName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from("services").insert({
        name: newName.trim(),
        slug,
        pricing_unit: newUnit,
        unit_price: Number(newPrice) || 0,
        price_label: newPriceLabel.trim() || `KSh ${newPrice}`,
        subtitle: newSubtitle.trim() || "per item",
        description:
          newDescription.trim() || "Professional Urban Wash care service.",
        icon_key: "sparkles",
        is_active: true,
        sort_order: services.length + 1,
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setNewName("");
      setNewSlug("");
      setNewDescription("");
      setNewServiceOpen(false);
      await reloadAll();
      showSuccess("New service added.");
    } finally {
      setBusyId(null);
    }
  };

  const updateUserRole = async (profileId: string, role: string) => {
    setBusyId(`user-${profileId}`);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", profileId);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await reloadAll();
      showSuccess(`User role updated to ${role}.`);
    } finally {
      setBusyId(null);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyUserId) return;
    setBusyId("send-notif");
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").insert({
        user_id: notifyUserId,
        order_id: notifyOrderId ? Number(notifyOrderId) : null,
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
        channel: "in_app",
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setNotifyTitle("");
      setNotifyMessage("");
      showSuccess("In-app notification sent.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Admin Operations Console
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
            Urban Wash Management
          </h1>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {toast}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          {errorMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5"
      >
        {[
          { id: "orders", label: "Orders Pipeline", icon: ClipboardList },
          { id: "services", label: "Services & Pricing", icon: Settings2 },
          { id: "users", label: "Users & Riders", icon: Users },
          { id: "notify", label: "Send Notification", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                active
                  ? "bg-[#0B1F3A] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Orders Pipeline */}
      {activeTab === "orders" && (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search order code, customer, phone, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="uw-input pl-9"
              />
            </div>

            <select
              aria-label="Filter orders by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="uw-input sm:w-52"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby={ordersCaptionId}
            className="table-wrapper"
          >
            <table
              className="uw-table"
              style={
                {
                  "--label-2": '"Customer"',
                  "--label-3": '"Pickup"',
                  "--label-4": '"Status"',
                  "--label-5": '"Rider"',
                  "--label-6": '"Payment"',
                } as React.CSSProperties
              }
            >
              <caption id={ordersCaptionId} className="visually-hidden">
                All customer orders pipeline
              </caption>
              <thead>
                <tr>
                  <th scope="col">Order #</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Pickup</th>
                  <th scope="col">Status</th>
                  <th scope="col">Rider</th>
                  <th scope="col">Payment / View</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <th scope="row">
                      <div>{order.order_code}</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {formatKsh(order.total_amount)}
                      </div>
                    </th>
                    <td>
                      <div className="font-semibold text-slate-800">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td>
                      <div>{formatOrderDate(order.pickup_date)}</div>
                      <div className="max-w-44 truncate text-xs text-slate-500">
                        {order.pickup_address}
                      </div>
                    </td>
                    <td>
                      <select
                        aria-label={`Status for ${order.order_code}`}
                        disabled={busyId === `order-${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0B1F3A]"
                      >
                        {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map(
                          (st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_META[st].label}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Assign rider for ${order.order_code}`}
                        disabled={busyId === `rider-${order.id}`}
                        value={order.rider_id ?? ""}
                        onChange={(e) => assignRider(order.id, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <option value="">Unassigned</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.full_name || r.email} ({r.role})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === `pay-${order.id}`}
                          onClick={() => togglePaymentPaid(order)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${
                            order.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.payment_status}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#1B75FF] hover:bg-blue-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Services & Pricing */}
      {activeTab === "services" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setNewServiceOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B75FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#145FD6]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Service
            </button>
          </div>

          {newServiceOpen && (
            <form
              onSubmit={handleCreateService}
              className="grid gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-xs sm:grid-cols-2"
            >
              <h2 className="sm:col-span-2 text-base font-extrabold text-[#0B1F3A]">
                New Laundry Service
              </h2>
              <input
                type="text"
                required
                placeholder="Service Name (e.g. Carpet Cleaning)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="uw-input"
              />
              <input
                type="text"
                placeholder="Slug (auto-generated if blank)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="uw-input"
              />
              <input
                type="number"
                required
                min={0}
                placeholder="Unit Price (KSh)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="uw-input"
              />
              <select
                value={newUnit}
                onChange={(e) =>
                  setNewUnit(
                    e.target.value as "kg" | "item" | "set" | "pair" | "flat"
                  )
                }
                className="uw-input"
              >
                <option value="item">item</option>
                <option value="kg">kg</option>
                <option value="set">set</option>
                <option value="pair">pair</option>
                <option value="flat">flat</option>
              </select>
              <input
                type="text"
                required
                placeholder="Price Label (e.g. KSh 800+)"
                value={newPriceLabel}
                onChange={(e) => setNewPriceLabel(e.target.value)}
                className="uw-input"
              />
              <input
                type="text"
                required
                placeholder="Subtitle (e.g. per carpet)"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                className="uw-input"
              />
              <input
                type="text"
                placeholder="Short description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="uw-input sm:col-span-2"
              />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewServiceOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === "new-svc"}
                  className="rounded-xl bg-[#1B75FF] px-5 py-2 text-xs font-bold text-white"
                >
                  Create Service
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0B1F3A]">{svc.name}</h3>
                    <p className="text-xs text-slate-400">{svc.slug}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={svc.is_active}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((s) =>
                            s.id === svc.id
                              ? { ...s, is_active: e.target.checked }
                              : s
                          )
                        )
                      }
                      className="h-4 w-4 rounded"
                    />
                    Active
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-500">
                      Unit Price (KSh)
                    </label>
                    <input
                      type="number"
                      value={svc.unit_price}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((s) =>
                            s.id === svc.id
                              ? { ...s, unit_price: Number(e.target.value) }
                              : s
                          )
                        )
                      }
                      className="uw-input py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-500">
                      Price Label
                    </label>
                    <input
                      type="text"
                      value={svc.price_label}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((s) =>
                            s.id === svc.id
                              ? { ...s, price_label: e.target.value }
                              : s
                          )
                        )
                      }
                      className="uw-input py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={svc.subtitle}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) =>
                          s.id === svc.id
                            ? { ...s, subtitle: e.target.value }
                            : s
                        )
                      )
                    }
                    className="uw-input py-1.5 text-sm"
                  />
                </div>

                <button
                  type="button"
                  disabled={busyId === `svc-${svc.id}`}
                  onClick={() => updateService(svc)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#102A4C] disabled:opacity-60"
                >
                  {busyId === `svc-${svc.id}` && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  )}
                  Save Service
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Users & Riders */}
      {activeTab === "users" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={usersCaptionId}
            className="table-wrapper"
          >
            <table
              className="uw-table"
              style={
                {
                  "--label-2": '"Email"',
                  "--label-3": '"Phone"',
                  "--label-4": '"Role"',
                } as React.CSSProperties
              }
            >
              <caption id={usersCaptionId} className="visually-hidden">
                Registered users and staff roles
              </caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Role</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">{p.full_name || "Unnamed User"}</th>
                    <td>{p.email}</td>
                    <td>{p.phone || "—"}</td>
                    <td>
                      <select
                        aria-label={`Role for ${p.email}`}
                        disabled={busyId === `user-${p.id}`}
                        value={p.role}
                        onChange={(e) => updateUserRole(p.id, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0B1F3A]"
                      >
                        <option value="customer">customer</option>
                        <option value="rider">rider</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: Send Notification */}
      {activeTab === "notify" && (
        <form
          onSubmit={handleSendNotification}
          className="max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
        >
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">
            Send Customer / Rider Notification
          </h2>

          <div>
            <label
              htmlFor="notify-recipient"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Recipient
            </label>
            <select
              id="notify-recipient"
              required
              value={notifyUserId}
              onChange={(e) => setNotifyUserId(e.target.value)}
              className="uw-input"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="notify-order"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Related Order (Optional)
            </label>
            <select
              id="notify-order"
              value={notifyOrderId}
              onChange={(e) => setNotifyOrderId(e.target.value)}
              className="uw-input"
            >
              <option value="">None</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_code} — {o.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="notify-title"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Notification Title
            </label>
            <input
              id="notify-title"
              type="text"
              required
              placeholder="Rider arriving in 10 minutes"
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              className="uw-input"
            />
          </div>

          <div>
            <label
              htmlFor="notify-msg"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Message
            </label>
            <textarea
              id="notify-msg"
              rows={3}
              required
              placeholder="Your Urban Wash rider is outside your gate."
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              className="uw-input"
            />
          </div>

          <button
            type="submit"
            disabled={busyId === "send-notif"}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B75FF] px-6 py-3 text-sm font-bold text-white hover:bg-[#145FD6] disabled:opacity-60"
          >
            {busyId === "send-notif" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Send Notification
          </button>
        </form>
      )}

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={reloadAll}
        allowCancel={false}
      />
    </div>
  );
}
