"use client";

import { useEffect, useState } from "react";
import { getUserInbox } from "@/lib/transactions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function Inbox() {
  const { profile, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    getUserInbox(profile.uid).then(setItems).catch(console.error);
  }, [profile]);

  if (loading || !profile) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-4">Inbox</h1>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-slate-500">No conversations yet.</div>}
        {items.map((it) => (
          <div
            key={it.id}
            onClick={() => router.push(`/transactions/${it.id}`)}
            className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{it.listingTitle}</div>
              <div className="text-sm text-slate-500 mt-1 truncate max-w-lg">{it.lastMessage ?? "No messages yet"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">{it.lastMessageAt?.toDate ? format(it.lastMessageAt.toDate(), 'Pp') : ''}</div>
              {( (profile.uid === it.buyerId && it.unreadBuyer) || (profile.uid === it.sellerId && it.unreadSeller) ) && (
                <div className="mt-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0f2d6b] text-white text-xs">•</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
