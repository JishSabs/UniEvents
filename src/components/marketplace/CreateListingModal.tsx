"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/marketplace";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, cn } from "@/lib/utils";
import { ListingType, PriceType } from "@/types";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";


interface CreateListingModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface ListingFormState {
  type: ListingType;
  title: string;
  description: string;
  price: string;
  priceType: PriceType;
  currency: string;
  category: string;
  location: string;
  tags: string;
  whatsapp: string;
  email: string;
  phone: string;
}

const MAX_IMAGES = 4;
const MAX_FILE_SIZE_MB = 5;

export default function CreateListingModal({ onClose, onCreated }: CreateListingModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState<ListingFormState>({
    type: "product",
    title: "",
    description: "",
    price: "",
    priceType: "fixed",
    currency: "USD",
    category: "other",
    location: "",
    tags: "",
    whatsapp: "",
    email: "",
    phone: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - imageFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`You can only add up to ${MAX_IMAGES} photos`);
      e.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    for (const file of files.slice(0, remainingSlots)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} is over ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

 const uploadImages = async (): Promise<string[]> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Missing env variables.");
  }

  const urls: string[] = [];
  for (const file of imageFiles) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    urls.push(data.secure_url);
  }
  return urls;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (!form.whatsapp && !form.email && !form.phone) {
      toast.error("Please provide at least one contact method");
      return;
    }

    setLoading(true);
    try {
      let imageURLs: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        imageURLs = await uploadImages();
        setUploadingImages(false);
      }

      await createListing({
        type: form.type as never,
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? parseFloat(form.price) : undefined,
        priceType: form.priceType as never,
        currency: form.currency,
        imageURLs,
        category: form.category,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        location: form.location || undefined,
        authorId: profile.uid,
        authorName: profile.displayName,
        contactInfo: {
          whatsapp: form.whatsapp || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
      });

      toast.success("Listing posted successfully!");
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to post listing. ${message}`);
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Post to Marketplace"
      description="Sell, offer services, or find help from fellow students"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Listing Type</label>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value as ListingType })}
                  className={cn(
                    "py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all",
                    form.type === t.value
                      ? "border-cyan-600 bg-cyan-600 text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photos <span className="text-slate-400 font-normal">(up to {MAX_IMAGES})</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, index) => (
                <div key={src} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              ))}

              {imageFiles.length < MAX_IMAGES && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 cursor-pointer transition-colors">
                  <ImagePlus size={18} />
                  <span className="text-[10px] font-medium">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Second-hand Calculus textbook"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you're offering in detail..."
              rows={4}
              required
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Type</label>
              <Select
                value={form.priceType}
                onChange={(e) => setForm({ ...form, priceType: e.target.value as PriceType })}
              >
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free</option>
                <option value="hourly">Per Hour</option>
              </Select>
            </div>
            {form.priceType !== "free" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <Select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZAR">ZAR</option>
                    <option value="GBP">GBP</option>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <Input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Library Block"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
              <Input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. math, used, cheap"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contact Info <span className="text-red-500">*</span>{" "}
              <span className="text-slate-400 font-normal">(at least one)</span>
            </label>
            <div className="space-y-2">
              <Input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="WhatsApp number (e.g. +263712345678)"
              />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
              />
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading
                ? uploadingImages
                  ? "Uploading photos..."
                  : "Posting..."
                : "Post Listing"}
            </Button>
          </div>
      </form>
    </Modal>
  );
}
