"use client";

import { Announcement } from "@/types";
import { cn, timeAgo, formatDate } from "@/lib/utils";
import {
  Pin,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  ShieldCheck,
  GraduationCap,
  FileText,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface AnnouncementCardProps {
  announcement: Announcement;
  canModerate?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-700",
  event: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  emergency: "bg-red-100 text-red-700",
  gig: "bg-orange-100 text-orange-700",
  party: "bg-pink-100 text-pink-700",
  club: "bg-indigo-100 text-indigo-700",
  general: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
};

function tiltFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  const deg = (hash % 3) - 1;
  return deg;
}

export default function AnnouncementCard({
  announcement,
  canModerate,
  onApprove,
  onReject,
  onDelete,
  onPin,
}: AnnouncementCardProps) {
  const isOfficial = announcement.source === "official";
  const tilt = announcement.isPinned ? tiltFor(announcement.id) : 0;

  return (
    <div
      className="relative"
      style={announcement.isPinned ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      {announcement.isPinned && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_2px_4px_rgba(0,0,0,0.25)] ring-2 ring-white" />
          <div className="w-px h-2 bg-amber-400/60" />
        </div>
      )}

      {isOfficial && (
        <div className="absolute -top-3 -left-3 z-10 w-9 h-9 rounded-full bg-[#0f2d6b] ring-2 ring-[#f5a623] shadow-md flex items-center justify-center">
          <ShieldCheck size={16} className="text-[#f5a623]" />
        </div>
      )}

      <div
        className={cn(
          "bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
          isOfficial
            ? "border-amber-200/70 shadow-[0_1px_3px_rgba(15,45,107,0.08)] hover:shadow-[0_8px_24px_rgba(15,45,107,0.14)]"
            : "border-slate-200 shadow-sm hover:shadow-md"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 flex items-center justify-between",
            isOfficial ? "bg-[#0f2d6b] pl-9" : "bg-slate-700"
          )}
        >
          <div className="flex items-center gap-2">
            {isOfficial ? (
              <span className="text-[10px] font-bold text-[#f5a623] uppercase tracking-[0.12em]">
                Official University
              </span>
            ) : (
              <>
                <GraduationCap size={13} className="text-slate-300" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.12em]">
                  Student Post
                </span>
              </>
            )}
          </div>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide",
              CATEGORY_COLORS[announcement.category] ?? CATEGORY_COLORS.other
            )}
          >
            {announcement.category}
          </span>
        </div>

        <div className="p-5">
          {announcement.attachmentType === "image" && announcement.attachmentURL && (
            <div className="mb-4 rounded-xl overflow-hidden h-48 relative bg-slate-100">
              <Image
                src={announcement.attachmentURL}
                alt={announcement.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {announcement.attachmentType === "pdf" && announcement.attachmentURL && (
            
             <a href={announcement.attachmentURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <div className="w-10 h-12 rounded-md bg-red-500 flex items-center justify-center shrink-0 shadow-sm">
                <FileText size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {announcement.attachmentName || "Document.pdf"}
                </p>
                <p className="text-xs text-slate-400">PDF · Tap to view</p>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          <h3
            className="text-lg font-semibold text-slate-900 mb-2 leading-snug"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {announcement.title}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
            {announcement.content}
          </p>

          {(announcement.eventDate || announcement.eventLocation) && (
            <div className="flex flex-wrap gap-3 mb-4">
              {announcement.eventDate && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                  <Calendar size={12} className="text-[#0f2d6b]" />
                  {formatDate(announcement.eventDate)}
                </div>
              )}
              {announcement.eventLocation && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                  <MapPin size={12} className="text-[#0f2d6b]" />
                  {announcement.eventLocation}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-700">{announcement.authorName}</p>
              <p className="text-xs text-slate-400">{timeAgo(announcement.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Eye size={12} />
                {announcement.viewCount}
              </div>

              {canModerate && (
                <div className="flex items-center gap-1">
                  {announcement.status === "pending" && (
                    <>
                      <button
                        onClick={() => onApprove?.(announcement.id)}
                        className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => onReject?.(announcement.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                  {onPin && (
                    <button
                      onClick={() => onPin(announcement.id, !announcement.isPinned)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        announcement.isPinned
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                      )}
                      title={announcement.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete?.(announcement.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {announcement.status === "pending" && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">⏳ Awaiting approval</p>
            </div>
          )}
          {announcement.status === "rejected" && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-medium">
                ✗ Rejected{announcement.rejectionReason ? `: ${announcement.rejectionReason}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}