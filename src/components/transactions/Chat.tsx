"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToMessages, sendMessageWithPreview, markMessagesRead } from "@/lib/transactions";
import { Message } from "@/types";
import { format } from "date-fns";

interface ChatProps {
  transactionId: string;
  currentUserId?: string;
  currentUserName?: string;
}

export default function Chat({ transactionId, currentUserId, currentUserName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    const unsub = subscribeToMessages(transactionId, (msgs) => {
      setMessages(msgs as Message[]);
      // scroll to bottom
      setTimeout(() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }), 50);
      // mark messages read for current user
      if (currentUserId) markMessagesRead(transactionId, currentUserId).catch(console.error);
    });
    return () => unsub();
  }, [transactionId]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId || !currentUserName) return;
    setSending(true);
    try {
      await sendMessageWithPreview(transactionId, currentUserId, currentUserName, text.trim());
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-80 border-t border-slate-100">
      <div ref={ref} className="p-3 overflow-y-auto flex-1 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl ${m.senderId === currentUserId ? "bg-[#0f2d6b] text-white" : "bg-slate-100 text-slate-800"}`}>
              <div className="text-xs font-semibold">{m.senderName}</div>
              <div className="text-sm mt-1">{m.text}</div>
              <div className="text-[10px] text-slate-400 mt-1 text-right">{m.createdAt?.toDate ? format(m.createdAt.toDate(), 'p') : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentUserId ? "Write a message..." : "Log in to send messages"}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
          disabled={!currentUserId}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
        />
        <button onClick={handleSend} disabled={!currentUserId || sending} className="px-3 py-2 bg-[#0f2d6b] text-white rounded-xl text-sm disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
