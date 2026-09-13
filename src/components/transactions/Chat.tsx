"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToMessages, sendMessageWithPreview, markMessagesRead } from "@/lib/transactions";
import { Message } from "@/types";
import { format, isSameDay } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { toDateSafe } from "@/lib/utils";

interface ChatProps {
  transactionId: string;
  currentUserId?: string;
  currentUserName?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Chat({ transactionId, currentUserId, currentUserName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    const unsub = subscribeToMessages(transactionId, (msgs) => {
      setMessages(msgs as Message[]);
      setLoading(false);
      setTimeout(() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }), 50);
      if (currentUserId) markMessagesRead(transactionId, currentUserId).catch(console.error);
    });
    return () => unsub();
  }, [transactionId, currentUserId]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value || !currentUserId || !currentUserName || sending) return;
    setText("");
    setSending(true);
    try {
      await sendMessageWithPreview(transactionId, currentUserId, currentUserName, value);
    } catch (err) {
      console.error(err);
      setText(value);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-96 border-t border-slate-100 bg-slate-50/40">
      <div ref={ref} className="p-4 overflow-y-auto flex-1 space-y-1">
        {loading ? (
          <div className="flex flex-col gap-3 h-full justify-end">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-10 rounded-2xl bg-slate-200/70 animate-pulse ${
                  i % 2 === 0 ? "w-2/3 self-start" : "w-1/2 self-end"
                }`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
              <Send size={16} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No messages yet</p>
            <p className="text-xs">Say hello to get the conversation started.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === currentUserId;
            const date = toDateSafe(m.createdAt);
            const prevDate = toDateSafe(messages[i - 1]?.createdAt);
            const showDateDivider = date && (!prevDate || !isSameDay(date, prevDate));
            const prevSameSender = messages[i - 1]?.senderId === m.senderId && !showDateDivider;

            return (
              <div key={m.id}>
                {showDateDivider && date && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      {format(date, "MMMM d")}
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${prevSameSender ? "mt-0.5" : "mt-3"}`}>
                  {!mine && !prevSameSender && (
                    <div className="w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {getInitials(m.senderName)}
                    </div>
                  )}
                  {!mine && prevSameSender && <div className="w-6 shrink-0" />}

                  <div
                    className={`max-w-[75%] px-3.5 py-2 shadow-sm ${
                      mine
                        ? `bg-cyan-600 text-white ${prevSameSender ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tr-sm"}`
                        : `bg-white text-slate-800 border border-slate-100 ${prevSameSender ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-tl-sm"}`
                    }`}
                  >
                    {!mine && !prevSameSender && (
                      <div className="text-[11px] font-semibold text-cyan-600 mb-0.5">{m.senderName}</div>
                    )}
                    <div className="text-sm leading-snug break-words">{m.text}</div>
                    <div className={`text-[10px] mt-1 text-right ${mine ? "text-white/60" : "text-slate-400"}`}>
                      {date ? format(date, "p") : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentUserId ? "Write a message..." : "Log in to send messages"}
          className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 disabled:bg-slate-50 disabled:text-slate-400 transition"
          disabled={!currentUserId}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={!currentUserId || sending || !text.trim()}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-cyan-600 text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-700 active:scale-95 transition"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}