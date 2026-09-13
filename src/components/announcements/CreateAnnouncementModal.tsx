"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createAnnouncement } from "@/lib/announcements";
import { ANNOUNCEMENT_CATEGORIES, cn } from "@/lib/utils";
import { Loader2, Upload, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CreateAnnouncementModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const MAX_FILE_SIZE_MB = 10;

export default function CreateAnnouncementModal({
  onClose,
  onCreated,
}: CreateAnnouncementModalProps) {
  const { profile, isAdmin, isModerator } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    source: isAdmin || isModerator ? "official" : "student",
    eventDate: "",
    eventLocation: "",
    tags: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    const isPdf = selected.type === "application/pdf";
    const isImage = selected.type.startsWith("image/");

    if (!isPdf && !isImage) {
      toast.error("Only images and PDF files are supported");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setFile(selected);
    setFileType(isPdf ? "pdf" : "image");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const uploadAttachment = async (
    fileToUpload: File
  ): Promise<{ url: string; type: "image" | "pdf" }> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Missing env variables.");
    }

    const isPdf = fileToUpload.type === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      throw new Error(isPdf ? "PDF upload failed" : "Image upload failed");
    }

    const data = await res.json();
    return { url: data.secure_url, type: isPdf ? "pdf" : "image" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);

    let attachmentURL: string | undefined;
    let attachmentType: "image" | "pdf" | undefined;
    let attachmentName: string | undefined;

    if (file) {
      setUploading(true);
      try {
        const result = await uploadAttachment(file);
        attachmentURL = result.url;
        attachmentType = result.type;
        attachmentName = file.name;
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Please try again.";
        toast.error(`Failed to upload attachment. ${message}`);
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    }

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
        ...(attachmentURL && { attachmentURL, attachmentType, attachmentName }),
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

  const isBusy = loading || uploading;

  return (
    <Modal
      onClose={onClose}
      title="Post Announcement"
      description={
        isModerator
          ? "Your post will be published immediately."
          : "Your post will be reviewed before publishing."
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {isModerator && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Post Type</label>
            <div className="flex gap-3">
              {["official", "student"].map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm({ ...form, source: src })}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                    form.source === src
                      ? src === "official"
                        ? "border-cyan-600 bg-cyan-600 text-white"
                        : "border-slate-600 bg-slate-600 text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {src === "official" ? "🏛️ Official" : "🎓 Student"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. End of Year Party at Block C!"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <Select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Content <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Describe your announcement in detail..."
            rows={5}
            required
          />
        </div>

        {/* Attachment upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Attachment <span className="text-slate-400">(optional — photo or PDF, max {MAX_FILE_SIZE_MB}MB)</span>
          </label>

          {!file ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:border-cyan-400 hover:bg-slate-50 transition-colors">
              <Upload size={20} className="text-slate-400" />
              <span className="text-xs text-slate-500">Click to upload a photo or PDF</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              {fileType === "image" && filePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Event Date <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Location <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              type="text"
              value={form.eventLocation}
              onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
              placeholder="e.g. Main Hall, Block A"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tags <span className="text-slate-400">(comma-separated)</span>
          </label>
          <Input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="e.g. music, free entry, friday"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy} className="flex-1">
            {isBusy && <Loader2 size={15} className="animate-spin" />}
            {uploading ? "Uploading..." : loading ? "Posting..." : isModerator ? "Post Now" : "Submit for Review"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
