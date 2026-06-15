"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getApprovedAnnouncements,
  approveAnnouncement,
  rejectAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
} from "@/lib/announcements";
import { Announcement, AnnouncementSource, AnnouncementCategory } from "@/types";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import CreateAnnouncementModal from "@/components/announcements/CreateAnnouncementModal";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/utils";
import { Plus, Filter, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function AnnouncementsContent() {
  const { user, isModerator } = useAuth();
  const searchParams = useSearchParams();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterSource, setFilterSource] = useState<AnnouncementSource | undefined>(
    (searchParams.get("source") as AnnouncementSource) || undefined
  );
  const [filterCategory, setFilterCategory] = useState<AnnouncementCategory | undefined>();
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApprovedAnnouncements(filterSource, filterCategory);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await approveAnnouncement(id, "moderator");
      toast.success("Announcement approved");
      load();
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    try {
      await rejectAnnouncement(id, reason ?? "");
      toast.success("Announcement rejected");
      load();
    } catch { toast.error("Failed to reject"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      await pinAnnouncement(id, pinned);
      toast.success(pinned ? "Announcement pinned" : "Announcement unpinned");
      load();
    } catch { toast.error("Failed to update pin"); }
  };

  const filtered = announcements.filter((a) =>
    search.trim() === "" ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Announcements
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Official notices and student posts from across campus
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0f2d6b] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#1a3e8a] transition-colors shrink-0"
          >
            <Plus size={16} /> Post Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/20 focus:border-[#0f2d6b]"
          />
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {(["all", "official", "student"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src === "all" ? undefined : src)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                (src === "all" ? !filterSource : filterSource === src)
                  ? src === "official"
                    ? "bg-[#0f2d6b] text-white"
                    : src === "student"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {src === "all" ? "All" : src === "official" ? "🏛️ Official" : "🎓 Student"}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilterCategory(undefined)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !filterCategory ? "bg-[#0f2d6b] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          All Categories
        </button>
        {ANNOUNCEMENT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value as AnnouncementCategory)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filterCategory === c.value
                ? "bg-[#0f2d6b] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#0f2d6b]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📢</p>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No announcements yet</h3>
          <p className="text-slate-400 text-sm">
            {search ? "Try a different search term." : "Check back soon or be the first to post!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              canModerate={isModerator}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
  
}
export default function AnnouncementsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#0f2d6b]" />
      </div>
    }>
      <AnnouncementsContent />
    </Suspense>
  );
}