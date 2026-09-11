"use client";

import { useEffect, useState } from "react";
import { getUserInbox } from "@/lib/transactions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { Inbox as InboxIcon, ChevronRight } from "lucide-react";
import { toDateSafe } from "@/lib/utils";

function getInitials(title: string) {
  return title
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTimestamp(date: Date) {
  if (isToday(date)) return format(date, "p");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];
function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Inbox() {
  const { profile, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    setItemsLoading(true);
    getUserInbox(profile.uid)
      .then(setItems)
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Inbox</h1>
        {items.length > 0 && <span className="text-sm text-slate-400">{items.length} conversation{items.length !== 1 ? "s" : ""}</span>}
      </div>

      {itemsLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <InboxIcon size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">No conversations yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            When you message a buyer or seller, your conversations will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const isUnread =
              (profile.uid === it.buyerId && it.unreadBuyer) ||
              (profile.uid === it.sellerId && it.unreadSeller);
            const date = toDateSafe(it.lastMessageAt);

            return (
              <div
                key={it.id}
                onClick={() => router.push(`/transactions/${it.id}`)}
                className={`group p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  isUnread
                    ? "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
                    : "border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${colorFor(
                    it.id
                  )}`}
                >
                  {getInitials(it.listingTitle || "?")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`truncate ${isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                      {it.listingTitle}
                    </div>
                    <div className={`text-xs shrink-0 ${isUnread ? "text-indigo-600 font-medium" : "text-slate-400"}`}>
                      {date ? formatTimestamp(date) : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className={`text-sm truncate ${isUnread ? "text-slate-700" : "text-slate-500"}`}>
                      {it.lastMessage ?? "No messages yet"}
                    </div>
                    {isUnread ? (
                      <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    ) : (
                      <ChevronRight size={16} className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}