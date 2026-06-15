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

export default function AnnouncementCard({
  announcement,
  canModerate,
  onApprove,
  onReject,
  onDelete,
  onPin,
}: AnnouncementCardProps) {
  const isOfficial = announcement.source === "official";

  return (
    <div
      className={cn(
        "card-hover bg-white rounded-2xl border overflow-hidden",
        isOfficial
          ? "border-amber-200 shadow-amber-50/80 shadow-md"
          : "border-slate-200 shadow-sm",
        announcement.isPinned && "ring-2 ring-amber-400"
      )}
    >
      {/* Source banner */}
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between",
          isOfficial ? "bg-[#0f2d6b]" : "bg-slate-700"
        )}
      >
        <div className="flex items-center gap-2">
          {isOfficial ? (
            <>
              <ShieldCheck size={14} className="text-[#f5a623]" />
              <span className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider">
                Official University
              </span>
            </>
          ) : (
            <>
              <GraduationCap size={14} className="text-slate-300" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Student Post
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {announcement.isPinned && (
            <Pin size={12} className="text-amber-400" />
          )}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              CATEGORY_COLORS[announcement.category] ?? CATEGORY_COLORS.other
            )}
          >
            {announcement.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {announcement.imageURL && (
          <div className="mb-4 rounded-xl overflow-hidden h-48 relative">
            <Image
              src={announcement.imageURL}
              alt={announcement.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-snug"
          style={{ fontFamily: "var(--font-display)" }}>
          {announcement.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {announcement.content}
        </p>

        {/* Event details */}
        {(announcement.eventDate || announcement.eventLocation) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {announcement.eventDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={12} className="text-[#0f2d6b]" />
                {formatDate(announcement.eventDate)}
              </div>
            )}
            {announcement.eventLocation && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin size={12} className="text-[#0f2d6b]" />
                {announcement.eventLocation}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
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

            {/* Moderation actions */}
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

        {/* Status badge for pending */}
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
  );
}
