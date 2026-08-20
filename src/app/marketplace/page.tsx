"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getActiveListings, deleteListing } from "@/lib/marketplace";
import { MarketplaceListing, ListingType } from "@/types";
import ListingCard from "@/components/marketplace/ListingCard";
import CreateListingModal from "@/components/marketplace/CreateListingModal";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, cn } from "@/lib/utils";
import { Plus, Search, Loader2, ShoppingBag, Wrench, Briefcase, Star, Mail, ChevronDown } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

const TYPE_ICONS = {
  product: ShoppingBag,
  service: Wrench,
  job: Briefcase,
  gig: Star,
};

const CATEGORY_EMOJIS: Record<string, string> = {
  electronics: "📱",
  books: "📚",
  furniture: "🛋️",
  clothing: "👕",
  services: "🛠️",
  food: "🍔",
  tickets: "🎟️",
  transport: "🚗",
  other: "✨",
};

const PAGE_SIZE = 8;

function MarketplaceContent() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const marqueeImages = listings
    .flatMap((l) => l.imageURLs)
    .filter(Boolean)
    .slice(0, 14);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<ListingType | undefined>(
    (searchParams.get("type") as ListingType) || undefined
  );
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveListings(filterType, filterCategory);
      setListings(data);
      setVisibleCount(PAGE_SIZE);
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

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const sectionLabel = filterType
    ? LISTING_TYPES.find((t) => t.value === filterType)?.label ?? "Listings"
    : filterCategory
    ? MARKETPLACE_CATEGORIES.find((c) => c.value === filterCategory)?.label ?? "Listings"
    : "All Listings";

  return (
    <div className="bg-slate-50 min-h-screen">
     {/* Hero */}
<div className="relative overflow-hidden">
  {/* Sliding product photos backdrop */}
  {listings.length > 0 && (
    <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-30">
      <div className="flex gap-3 animate-marquee-left w-max">
        {[...marqueeImages, ...marqueeImages].map((src, i) => (
          <div
            key={`row1-${i}`}
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden shrink-0 grayscale"
          >
            <Image src={src} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 animate-marquee-right w-max">
        {[...marqueeImages].reverse().concat([...marqueeImages].reverse()).map((src, i) => (
          <div
            key={`row2-${i}`}
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden shrink-0 grayscale"
          >
            <Image src={src} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  )}

 {/* Color wash on top of the photos — lighter, and stronger at the edges/bottom where text sits */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/55 via-[#0f766e]/50 to-[#0f2d6b]/70" />
  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d6b]/80 via-transparent to-transparent" />

  <div className="absolute inset-0 opacity-10">
    <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
    <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-white blur-2xl" />
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-teal-100 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
          Campus Marketplace
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Buy, sell & hire<br className="hidden sm:block" /> within your community
        </h1>
      </div>
      {user && (
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push("/inbox")}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Inbox"
          >
            <Mail size={18} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white text-[#0d9488] px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-semibold text-sm hover:bg-teal-50 transition-colors shrink-0 shadow-lg"
          >
            <Plus size={18} /> <span className="hidden xs:inline">Post Listing</span>
          </button>
        </div>
      )}
    </div>
  </div>
</div>

          {/* Search bar sits on the banner */}
          <div className="mt-6 sm:mt-8 bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <select
              value={filterCategory ?? ""}
              onChange={(e) => setFilterCategory(e.target.value || undefined)}
              className="px-4 py-3 rounded-xl text-sm focus:outline-none bg-slate-50 text-slate-600 sm:w-44"
            >
              <option value="">All Categories</option>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Category icon strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(undefined)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl transition-all",
              !filterCategory ? "bg-[#0d9488] shadow-md" : "bg-white border border-slate-200 group-hover:border-teal-300"
            )}>
              🗂️
            </div>
            <span className={cn("text-[11px] font-medium", !filterCategory ? "text-[#0d9488]" : "text-slate-500")}>
              All
            </span>
          </button>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl transition-all",
                filterCategory === c.value ? "bg-[#0d9488] shadow-md" : "bg-white border border-slate-200 group-hover:border-teal-300"
              )}>
                {CATEGORY_EMOJIS[c.value] ?? "🏷️"}
              </div>
              <span className={cn("text-[11px] font-medium whitespace-nowrap", filterCategory === c.value ? "text-[#0d9488]" : "text-slate-500")}>
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterType(undefined)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors",
              !filterType ? "bg-[#0f2d6b] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors",
                  filterType === t.value
                    ? "bg-[#0f2d6b] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Section header */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">{sectionLabel}</h2>
              <p className="text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
          </div>
        )}

        {/* Listings grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#0d9488]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-4xl mb-4">🛒</p>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nothing here yet</h3>
            <p className="text-slate-400 text-sm">
              {search ? "Try a different search term." : "Be the first to post a listing!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {visible.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  canDelete={isAdmin || listing.authorId === profile?.uid}
                  onDelete={handleDelete}
                  currentUserId={profile?.uid}
                  currentUserName={profile?.displayName}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View More <ChevronDown size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

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