"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getActiveListings, deleteListing } from "@/lib/marketplace";
import { MarketplaceListing, ListingType } from "@/types";
import ListingCard from "@/components/marketplace/ListingCard";
import CreateListingModal from "@/components/marketplace/CreateListingModal";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, cn } from "@/lib/utils";
import { Plus, Search, Loader2, ShoppingBag, Wrench, Briefcase, Star } from "lucide-react";
import toast from "react-hot-toast";

const TYPE_ICONS = {
  product: ShoppingBag,
  service: Wrench,
  job: Briefcase,
  gig: Star,
};

function MarketplaceContent() {
  const { user, profile, isAdmin } = useAuth();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<ListingType | undefined>(
    (searchParams.get("type") as ListingType) || undefined
  );
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveListings(filterType, filterCategory);
      setListings(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteListing(id);
      toast.success("Listing deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = listings.filter(
    (l) =>
      search.trim() === "" ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Marketplace
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Buy, sell, hire and offer services within the campus community
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0d9488] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-teal-700 transition-colors shrink-0"
          >
            <Plus size={16} /> Post Listing
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterType(undefined)}
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
            !filterType ? "bg-[#0d9488] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          All Listings
        </button>
        {LISTING_TYPES.map((t) => {
          const Icon = TYPE_ICONS[t.value as ListingType];
          return (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value as ListingType)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                filterType === t.value
                  ? "bg-[#0d9488] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Search & category */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={filterCategory ?? ""}
          onChange={(e) => setFilterCategory(e.target.value || undefined)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-600"
        >
          <option value="">All Categories</option>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#0d9488]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🛒</p>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nothing here yet</h3>
          <p className="text-slate-400 text-sm">
            {search ? "Try a different search term." : "Be the first to post a listing!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              canDelete={isAdmin || listing.authorId === profile?.uid}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#0d9488]" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}