"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Plus, Filter, Search, Landmark, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

function AnnouncementsContent() {
  const { user, isModerator, loading: authLoading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600 shadow-sm shadow-cyan-600/20 flex items-center justify-center shrink-0">
            <Landmark size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Announcements
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Official notices and student posts from across campus
            </p>
          </div>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(buttonVariants({ variant: "primary" }), "shrink-0")}
          >
            <Plus size={16} /> Post Announcement
          </button>
        )}
      </div>

     {/* Filters */}
      <Card padding="sm" className="mb-8 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1">
          <Filter size={13} className="text-slate-400 shrink-0 ml-1.5" />
          {(["all", "official", "student"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src === "all" ? undefined : src)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                (src === "all" ? !filterSource : filterSource === src)
                  ? src === "official"
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-700 text-white shadow-sm"
                    : src === "student"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {src === "all" ? "All" : src === "official" ? "🏛️ Official" : "🎓 Student"}
            </button>
          ))}
        </div>
      </Card>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilterCategory(undefined)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !filterCategory ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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
                ? "bg-cyan-600 text-white"
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
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={search ? "Try a different search term." : "Check back soon or be the first to post!"}
        />
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
        <Spinner size={32} />
      </div>
    }>
      <AnnouncementsContent />
    </Suspense>
  );
}