"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatOrderTimestamp } from "@/lib/pricing";
import type { NotificationRow } from "@/lib/types/database";

export function NotificationsFeed({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: NotificationRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>(initialNotifications);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload, userId]);

  const markAsRead = async (id: number) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    router.refresh();
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time pickup alerts, wash updates, and delivery notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4 text-[#1B75FF]" aria-hidden="true" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            No notifications yet. Place an order to receive live status alerts!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                item.is_read
                  ? "border-slate-200 bg-white"
                  : "border-blue-200 bg-blue-50/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!item.is_read && (
                    <span
                      aria-label="Unread"
                      className="h-2.5 w-2.5 rounded-full bg-[#1B75FF]"
                    />
                  )}
                  <h2 className="text-sm font-bold text-[#0B1F3A]">
                    {item.title}
                  </h2>
                </div>
                <p className="text-sm text-slate-600">{item.message}</p>
                <p className="text-xs text-slate-400">
                  {formatOrderTimestamp(item.created_at)}
                </p>
              </div>

              {!item.is_read && (
                <button
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#1B75FF] ring-1 ring-blue-200 hover:bg-blue-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
