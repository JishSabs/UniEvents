"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getActiveListings, deleteListing } from "@/lib/marketplace";
import { MarketplaceListing, ListingType } from "@/types";
import ListingCard from "@/components/marketplace/ListingCard";
import CreateListingModal from "@/components/marketplace/CreateListingModal";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, cn } from "@/lib/utils";
import { Plus, Search, Loader2, ShoppingBag, Wrench, Briefcase, Star, Mail } from "lucide-react";
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

function MarketplaceContent() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
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
    <div className="bg-slate-50 min-h-screen">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#0f2d6b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-white blur-2xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-teal-100 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
                Campus Marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Buy, sell & hire<br className="hidden sm:block" /> within your community
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/inbox')}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Inbox"
                >
                  <Mail size={18} />
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-white text-[#0d9488] px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-teal-50 transition-colors shrink-0 shadow-lg"
                >
                  <Plus size={18} /> Post Listing
                </button>
              </div>
            )}
          </div>

          {/* Search bar sits on the banner */}
          <div className="mt-8 bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl max-w-2xl">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category icon strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(undefined)}
            className={cn(
              "flex flex-col items-center gap-2 shrink-0 group"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all",
              !filterCategory ? "bg-[#0d9488] shadow-md" : "bg-white border border-slate-200 group-hover:border-teal-300"
            )}>
              🗂️
            </div>
            <span className={cn("text-xs font-medium", !filterCategory ? "text-[#0d9488]" : "text-slate-500")}>
              All
            </span>
          </button>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all",
                filterCategory === c.value ? "bg-[#0d9488] shadow-md" : "bg-white border border-slate-200 group-hover:border-teal-300"
              )}>
                {CATEGORY_EMOJIS[c.value] ?? "🏷️"}
              </div>
              <span className={cn("text-xs font-medium whitespace-nowrap", filterCategory === c.value ? "text-[#0d9488]" : "text-slate-500")}>
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilterType(undefined)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
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
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  filterType === t.value
                    ? "bg-[#0f2d6b] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((listing) => (
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