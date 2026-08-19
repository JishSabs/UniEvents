"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserAnnouncements } from "@/lib/announcements";
import { getUserListings, deleteListing } from "@/lib/marketplace";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import ListingCard from "@/components/marketplace/ListingCard";
import { Announcement, MarketplaceListing } from "@/types";
import { Loader2, User, BookOpen, ShoppingBag, ShieldCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        const [userAnnouncements, userListings] = await Promise.all([
          getUserAnnouncements(profile.uid),
          getUserListings(profile.uid),
        ]);
        setAnnouncements(userAnnouncements);
        setListings(userListings);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <Loader2 size={32} className="animate-spin text-[#0f2d6b]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_2fr]">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-3xl bg-[#0f2d6b] flex items-center justify-center text-white text-2xl font-bold">
              {profile.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-[0.15em]">Student Profile</p>
              <h1 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                {profile.displayName}
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                <p className="mt-2 font-medium text-slate-900 break-all">{profile.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                <p className="mt-2 font-medium text-slate-900 capitalize">{profile.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student ID</p>
                <p className="mt-2 font-medium text-slate-900">{profile.studentId ?? "Not set"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Member since</p>
                <p className="mt-2 font-medium text-slate-900">{timeAgo(profile.createdAt)}</p>
              </div>
            </div>

            {profile.isActive ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Active account
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Account is inactive. Contact support.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Posts</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{announcements.length}</p>
              <p className="text-sm text-slate-500 mt-1">Announcements</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Listings</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{listings.length}</p>
              <p className="text-sm text-slate-500 mt-1">Marketplace posts</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Access</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{isAdmin ? "Admin" : "Student"}</p>
              <p className="text-sm text-slate-500 mt-1">{isAdmin ? "Full moderation access" : "Standard account"}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <User size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">My Announcements</h2>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-[#0f2d6b]" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
                <BookOpen size={34} className="mx-auto mb-3" />
                <p>No announcements posted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <ShoppingBag size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">My Marketplace Listings</h2>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-[#0d9488]" />
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
                <ShoppingBag size={34} className="mx-auto mb-3" />
                <p>No marketplace listings yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    canDelete={listing.authorId === profile.uid || isAdmin}
                    onDelete={handleDeleteListing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
