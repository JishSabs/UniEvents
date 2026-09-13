"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getActiveListings, deleteListing } from "@/lib/marketplace";
import { MarketplaceListing, ListingType } from "@/types";
import ListingCard from "@/components/marketplace/ListingCard";
import CreateListingModal from "@/components/marketplace/CreateListingModal";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, cn } from "@/lib/utils";
import { Plus, Search, ShoppingBag, Wrench, Briefcase, Star, Mail, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

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
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

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
      {/* Clean header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
              <p className="text-sm text-slate-500 mt-0.5">Buy, sell & hire within your community</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {user && (
                <>
                  <button
                    onClick={() => router.push("/inbox")}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                    title="Inbox"
                  >
                    <Mail size={18} />
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={cn(buttonVariants({ variant: "primary" }), "shrink-0")}
                  >
                    <Plus size={18} /> <span className="hidden xs:inline">Post Listing</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
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
              !filterCategory ? "bg-cyan-600 shadow-md shadow-cyan-600/25" : "bg-white border border-slate-200 group-hover:border-cyan-300 group-hover:shadow-sm"
            )}>
              🗂️
            </div>
            <span className={cn("text-[11px] font-medium", !filterCategory ? "text-cyan-600" : "text-slate-500")}>
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
                filterCategory === c.value ? "bg-cyan-600 shadow-md shadow-cyan-600/25" : "bg-white border border-slate-200 group-hover:border-cyan-300 group-hover:shadow-sm"
              )}>
                {CATEGORY_EMOJIS[c.value] ?? "🏷️"}
              </div>
              <span className={cn("text-[11px] font-medium whitespace-nowrap", filterCategory === c.value ? "text-cyan-600" : "text-slate-500")}>
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
              !filterType ? "bg-cyan-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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
                    ? "bg-cyan-600 text-white shadow-sm"
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
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nothing here yet"
            description={search ? "Try a different search term." : "Be the first to post a listing!"}
            className="bg-white"
          />
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
        <Spinner size={32} />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}