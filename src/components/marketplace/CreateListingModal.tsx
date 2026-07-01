"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/marketplace";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES } from "@/lib/utils";
import { ListingType, PriceType } from "@/types";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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

export default function CreateListingModal({ onClose, onCreated }: CreateListingModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
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
      await createListing({
        type: form.type as never,
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? parseFloat(form.price) : undefined,
        priceType: form.priceType as never,
        currency: form.currency,
        imageURLs: [],
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Post to Marketplace
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Sell, offer services, or find help from fellow students</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Listing Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    form.type === t.value
                      ? "border-[#0d9488] bg-[#0d9488] text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Second-hand Calculus textbook"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
            >
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you're offering in detail..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
              required
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Type</label>
              <select
                value={form.priceType}
                onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
              >
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free</option>
                <option value="hourly">Per Hour</option>
              </select>
            </div>
            {form.priceType !== "free" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZAR">ZAR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Library Block"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. math, used, cheap"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
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
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="WhatsApp number (e.g. +263712345678)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

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
              className="flex-1 py-2.5 bg-[#0d9488] text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
