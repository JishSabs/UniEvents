"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createAnnouncement } from "@/lib/announcements";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Timestamp } from "firebase/firestore";

interface CreateAnnouncementModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAnnouncementModal({
  onClose,
  onCreated,
}: CreateAnnouncementModalProps) {
  const { profile, isAdmin, isModerator } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    source: isAdmin || isModerator ? "official" : "student",
    eventDate: "",
    eventLocation: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    try {
   await createAnnouncement({
  title: form.title.trim(),
  content: form.content.trim(),
  category: form.category as never,
  source: form.source as "official" | "student",
  authorId: profile.uid,
  authorName: profile.displayName,
  authorRole: profile.role,
  tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  ...(form.eventLocation && { eventLocation: form.eventLocation }),
  ...(form.eventDate && { eventDate: Timestamp.fromDate(new Date(form.eventDate)) }),
});

      const isAutoApproved = profile.role === "admin" || profile.role === "moderator";
      toast.success(
        isAutoApproved
          ? "Announcement posted!"
          : "Submitted for approval. A moderator will review it shortly."
      );
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Post Announcement
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isModerator
                ? "Your post will be published immediately."
                : "Your post will be reviewed before publishing."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Source selector — only admins/mods can post as official */}
          {isModerator && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Post Type
              </label>
              <div className="flex gap-3">
                {["official", "student"].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setForm({ ...form, source: src })}
                    className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.source === src
                        ? src === "official"
                          ? "border-[#0f2d6b] bg-[#0f2d6b] text-white"
                          : "border-slate-600 bg-slate-600 text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {src === "official" ? "🏛️ Official" : "🎓 Student"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. End of Year Party at Block C!"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b] transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b] bg-white"
            >
              {ANNOUNCEMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe your announcement in detail..."
              rows={5}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b] resize-none transition-all"
              required
            />
          </div>

          {/* Event details (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Event Date <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.eventLocation}
                onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
                placeholder="e.g. Main Hall, Block A"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tags <span className="text-slate-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. music, free entry, friday"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/30 focus:border-[#0f2d6b]"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#0f2d6b] text-white rounded-xl text-sm font-medium hover:bg-[#1a3e8a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Posting..." : isModerator ? "Post Now" : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
