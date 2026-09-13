"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserAnnouncements } from "@/lib/announcements";
import { getUserListings, deleteListing } from "@/lib/marketplace";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import ListingCard from "@/components/marketplace/ListingCard";
import { Announcement, MarketplaceListing } from "@/types";
import { User, BookOpen, ShoppingBag, ShieldCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Card from "@/components/ui/Card";
import StatTile from "@/components/ui/StatTile";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import LoadingScreen from "@/components/ui/LoadingScreen";

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
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_2fr]">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-[0.15em]">Student Profile</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {profile.displayName}
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                <p className="mt-2 font-medium text-slate-900 break-all">{profile.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                <p className="mt-2 font-medium text-slate-900 capitalize">{profile.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student ID</p>
                <p className="mt-2 font-medium text-slate-900">{profile.studentId ?? "Not set"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Member since</p>
                <p className="mt-2 font-medium text-slate-900">{timeAgo(profile.createdAt)}</p>
              </div>
            </div>

            {profile.isActive ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Active account
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Account is inactive. Contact support.
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padding="sm">
              <StatTile label="Posts" value={announcements.length} sublabel="Announcements" />
            </Card>
            <Card padding="sm">
              <StatTile label="Listings" value={listings.length} sublabel="Marketplace posts" />
            </Card>
            <Card padding="sm">
              <StatTile
                label="Access"
                value={isAdmin ? "Admin" : "Student"}
                sublabel={isAdmin ? "Full moderation access" : "Standard account"}
              />
            </Card>
          </div>

          <Card>
            <div className="flex items-center gap-3 mb-5">
              <User size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">My Announcements</h2>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size={28} />
              </div>
            ) : announcements.length === 0 ? (
              <EmptyState icon={BookOpen} title="No announcements posted yet." />
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-5">
              <ShoppingBag size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">My Marketplace Listings</h2>
            </div>
            {loadingData ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size={28} />
              </div>
            ) : listings.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No marketplace listings yet." />
            ) : (
              <div className="grid gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    canDelete={listing.authorId === profile.uid || isAdmin}
                    onDelete={handleDeleteListing}
                    currentUserId={profile.uid}
                    currentUserName={profile.displayName}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
