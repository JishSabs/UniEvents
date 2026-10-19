"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getPendingAnnouncements,
  approveAnnouncement,
  rejectAnnouncement,
  deleteAnnouncement,
  getApprovedAnnouncementCount,
} from "@/lib/announcements";
import { getAllUsers, updateUserRole, toggleUserActive, getAllUsersCount } from "@/lib/users";
import {
  getActiveListingCount,
  getPendingListings,
  getPendingListingsCount,
  approveListing,
  rejectListing,
  removeListing,
} from "@/lib/marketplace";
import {
  getPendingReports,
  getPendingReportsCount,
  resolveReport,
  dismissReport,
} from "@/lib/reports";
import { Announcement, UserProfile, UserRole, MarketplaceListing, Report, ReportReason } from "@/types";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import { cn, timeAgo, formatPrice } from "@/lib/utils";
import {
  Users,
  Clock,
  LayoutDashboard,
  Shield,
  ChevronRight,
  CheckCircle,
  UserCog,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
  Flag,
  AlertTriangle,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type Tab = "overview" | "pending" | "listings" | "reports" | "users";

const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  scam_or_fraud: "Scam or fraud",
  inappropriate_content: "Inappropriate content",
  fake_listing: "Fake or misleading listing",
  harassment: "Harassment or abuse",
  other: "Other",
};

export default function AdminPage() {
  const { user, profile, isModerator, isAdmin } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [pending, setPending] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [activeListingCount, setActiveListingCount] = useState<number>(0);
  const [approvedAnnouncementCount, setApprovedAnnouncementCount] = useState<number>(0);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Pending listings (marketplace moderation) ──────────────────────────
  const [pendingListings, setPendingListings] = useState<MarketplaceListing[]>([]);
  const [pendingListingCount, setPendingListingCount] = useState<number>(0);
  const [loadingListings, setLoadingListings] = useState(false);

  // ── Reports ──────────────────────────────────────────────────────────
  const [reports, setReports] = useState<Report[]>([]);
  const [reportCount, setReportCount] = useState<number>(0);
  const [loadingReports, setLoadingReports] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const loadOverview = async () => {
      setLoadingPending(true);
      setLoadingUsers(true);
      try {
        const results = await Promise.allSettled([
          getPendingAnnouncements(),
          getAllUsersCount(),
          getApprovedAnnouncementCount(),
          getActiveListingCount(),
          getPendingListingsCount(),
          getPendingReportsCount(),
        ]);

        const [pendingResult, totalUsers, approvedAnnouncements, activeListings, pendingListingsCountResult, reportsCountResult] = results;

        if (pendingResult.status === "fulfilled") setPendingCount(pendingResult.value.length);
        else console.error("Failed to load pending announcements:", pendingResult.reason);

        if (totalUsers.status === "fulfilled") setTotalUserCount(totalUsers.value);
        else console.error("Failed to load user count:", totalUsers.reason);

        if (approvedAnnouncements.status === "fulfilled") setApprovedAnnouncementCount(approvedAnnouncements.value);
        else console.error("Failed to load approved announcement count:", approvedAnnouncements.reason);

        if (activeListings.status === "fulfilled") setActiveListingCount(activeListings.value);
        else console.error("Failed to load active listing count:", activeListings.reason);

        if (pendingListingsCountResult.status === "fulfilled") setPendingListingCount(pendingListingsCountResult.value);
        else console.error("Failed to load pending listing count (check firestore.rules for the marketplace collection):", pendingListingsCountResult.reason);

        if (reportsCountResult.status === "fulfilled") setReportCount(reportsCountResult.value);
        else console.error("Failed to load report count (check firestore.rules for the reports collection):", reportsCountResult.reason);
      } finally {
        setLoadingPending(false);
        setLoadingUsers(false);
      }
    };

    loadOverview();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === "pending") loadPending();
    if (tab === "listings") loadPendingListings();
    if (tab === "reports") loadReports();
    if (tab === "users" && isAdmin) loadUsers();
  }, [tab, isAdmin]);

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const pendingAnnouncements = await getPendingAnnouncements();
      setPending(pendingAnnouncements);
      setPendingCount(pendingAnnouncements.length);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadPendingListings = async () => {
    setLoadingListings(true);
    try {
      const listings = await getPendingListings();
      setPendingListings(listings);
      setPendingListingCount(listings.length);
    } catch (err) {
      console.error("Failed to load pending listings:", err);
      toast.error("Couldn't load pending listings — check Firestore rules for the marketplace collection.");
    } finally {
      setLoadingListings(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const [reportResults, allUsers] = await Promise.all([
        getPendingReports(),
        // Reused to resolve reporter/reported names for display below.
        // If your Firestore rules restrict getAllUsers() to admins only,
        // moderators viewing this tab may see IDs instead of names — that's
        // a permissions question for firestore.rules, not a bug here.
        getAllUsers(),
      ]);
      setReports(reportResults);
      setReportCount(reportResults.length);
      const map: Record<string, UserProfile> = {};
      allUsers.forEach((u) => (map[u.uid] = u));
      setUserMap(map);
    } catch (err) {
      console.error("Failed to load reports:", err);
      toast.error("Couldn't load reports — check Firestore rules for the reports collection.");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      setUsers(await getAllUsers());
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAnnouncement(id, profile!.uid);
      toast.success("Approved!");
      loadPending();
    } catch { toast.error("Failed"); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason (optional):");
    try {
      await rejectAnnouncement(id, reason ?? "");
      toast.success("Rejected");
      loadPending();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      await deleteAnnouncement(id);
      loadPending();
    } catch { toast.error("Failed"); }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateUserRole(uid, role);
      toast.success("Role updated");
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role } : u));
    } catch { toast.error("Failed to update role"); }
  };

  const handleToggleActive = async (uid: string, isActive: boolean) => {
    try {
      await toggleUserActive(uid, !isActive);
      toast.success(isActive ? "User deactivated" : "User activated");
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, isActive: !isActive } : u));
    } catch { toast.error("Failed"); }
  };

  // ── Listing moderation actions ──────────────────────────────────────────
  const handleApproveListing = async (id: string) => {
    try {
      await approveListing(id, profile!.uid);
      toast.success("Listing approved — now live in the marketplace");
      loadPendingListings();
    } catch { toast.error("Failed"); }
  };

  const handleRejectListing = async (id: string) => {
    const reason = prompt("Rejection reason (optional):");
    try {
      await rejectListing(id, reason ?? "");
      toast.success("Listing rejected");
      loadPendingListings();
    } catch { toast.error("Failed"); }
  };

  // ── Report actions ──────────────────────────────────────────────────────
  const handleDismissReport = async (report: Report) => {
    try {
      await dismissReport(report.id, profile!.uid);
      toast.success("Report dismissed");
      loadReports();
    } catch { toast.error("Failed"); }
  };

  const handleRemoveReportedListing = async (report: Report) => {
    if (!confirm("Remove this listing and resolve the report?")) return;
    try {
      await removeListing(report.itemId, `Removed following report: ${report.reason}`);
      await resolveReport(report.id, profile!.uid);
      toast.success("Listing removed and report resolved");
      loadReports();
    } catch { toast.error("Failed"); }
  };

  const handleDeactivateReportedUser = async (report: Report) => {
    if (!confirm("Deactivate this user's account and resolve the report?")) return;
    try {
      await toggleUserActive(report.reportedUserId, false);
      await resolveReport(report.id, profile!.uid);
      toast.success("User deactivated and report resolved");
      loadReports();
    } catch { toast.error("Failed"); }
  };

  if (!isModerator) return null;

  // How many times each reported user shows up across the currently
  // loaded pending reports — a quick "repeat offender" signal without an
  // extra database read per row.
  const reportedUserFrequency: Record<string, number> = {};
  reports.forEach((r) => {
    reportedUserFrequency[r.reportedUserId] = (reportedUserFrequency[r.reportedUserId] || 0) + 1;
  });

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pending", label: "Pending Posts", icon: Clock, badge: pendingCount || undefined },
    { id: "listings", label: "Pending Listings", icon: ShoppingBag, badge: pendingListingCount || undefined },
    { id: "reports", label: "Reports", icon: Flag, badge: reportCount || undefined },
    ...(isAdmin ? [{ id: "users", label: "User Management", icon: Users }] : []),
  ] as { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
            {isAdmin ? <Shield size={20} className="text-white" /> : <UserCog size={20} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAdmin ? "Admin Panel" : "Moderation"}
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">
          Logged in as <Badge variant={isAdmin ? "danger" : "warning"}>{profile?.role}</Badge>
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit min-w-full sm:min-w-0">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative whitespace-nowrap shrink-0",
                tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon size={15} /> {label}
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Pending Posts", value: pendingCount, icon: Clock, color: "text-amber-500 bg-amber-50", action: () => setTab("pending") },
              { label: "Pending Listings", value: pendingListingCount, icon: ShoppingBag, color: "text-orange-500 bg-orange-50", action: () => setTab("listings") },
              { label: "Reports", value: reportCount, icon: Flag, color: "text-red-500 bg-red-50", action: () => setTab("reports") },
              { label: "Total Users", value: totalUserCount, icon: Users, color: "text-cyan-600 bg-cyan-50", action: isAdmin ? () => setTab("users") : undefined },
              { label: "Active Listings", value: activeListingCount, icon: ShoppingBag, color: "text-slate-600 bg-slate-100" },
              { label: "Approved Announcements", value: approvedAnnouncementCount, icon: Shield, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, action }) => (
              <button
                key={label}
                onClick={action}
                disabled={!action}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200 p-5 text-left transition-shadow",
                  action ? "hover:shadow-md cursor-pointer" : "cursor-default"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-bold text-slate-900 mb-1 capitalize">{value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{label}</p>
                  {action && <ChevronRight size={13} className="text-slate-400" />}
                </div>
              </button>
            ))}
          </div>

          <Card>
            <h2 className="font-semibold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setTab("pending")}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                <Clock size={14} /> Review Pending Posts
              </button>
              <button
                onClick={() => setTab("listings")}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
              >
                <ShoppingBag size={14} /> Review Pending Listings
              </button>
              <button
                onClick={() => setTab("reports")}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Flag size={14} /> Review Reports
              </button>
              {isAdmin && (
                <button
                  onClick={() => setTab("users")}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl text-sm font-medium hover:bg-cyan-100 transition-colors"
                >
                  <UserCog size={14} /> Manage User Roles
                </button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Pending Posts (announcements) */}
      {tab === "pending" && (
        <div>
          {loadingPending ? (
            <div className="flex justify-center py-20">
              <Spinner size={32} />
            </div>
          ) : pending.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All clear!" description="No posts waiting for review." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  canModerate
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Listings (marketplace moderation) */}
      {tab === "listings" && (
        <div>
          {loadingListings ? (
            <div className="flex justify-center py-20">
              <Spinner size={32} />
            </div>
          ) : pendingListings.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All clear!" description="No marketplace listings waiting for review." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{listing.title}</h3>
                    <Badge variant="warning">{listing.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>{listing.authorName}</span>
                    <span>{timeAgo(listing.createdAt)}</span>
                  </div>
                  {listing.price !== undefined && (
                    <p className="text-sm font-bold text-slate-900 mb-4">
                      {listing.priceType === "free" ? "Free" : formatPrice(listing.price, listing.currency)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveListing(listing.id)}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectListing(listing.id)}
                      className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div>
          {loadingReports ? (
            <div className="flex justify-center py-20">
              <Spinner size={32} />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All clear!" description="No reports waiting for review." />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const reporter = userMap[report.reporterId];
                const reported = userMap[report.reportedUserId];
                const isRepeatOffender = reportedUserFrequency[report.reportedUserId] > 1;
                return (
                  <div key={report.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                          <Flag size={14} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {REPORT_REASON_LABELS[report.reason]}
                          </p>
                          <p className="text-xs text-slate-400">
                            {report.itemType} · reported {timeAgo(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      {isRepeatOffender && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          <AlertTriangle size={12} /> Repeat offender
                        </span>
                      )}
                    </div>

                    {report.details && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-3">
                        "{report.details}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 mb-4">
                      <div>
                        <span className="text-slate-400">Reported by: </span>
                        {reporter?.displayName ?? report.reporterId}
                      </div>
                      <div>
                        <span className="text-slate-400">Reported user: </span>
                        {reported?.displayName ?? report.reportedUserId}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {report.itemType === "listing" && (
                        <button
                          onClick={() => handleRemoveReportedListing(report)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          <ShoppingBag size={12} /> Remove listing
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeactivateReportedUser(report)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          <Ban size={12} /> Deactivate user
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissReport(report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* User management (admin only) */}
      {tab === "users" && isAdmin && (
        <div>
          {loadingUsers ? (
            <div className="flex justify-center py-20">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-6 py-4 font-medium text-slate-600">User</th>
                      <th className="text-left px-4 py-4 font-medium text-slate-600">Student ID</th>
                      <th className="text-left px-4 py-4 font-medium text-slate-600">Joined</th>
                      <th className="text-left px-4 py-4 font-medium text-slate-600">Role</th>
                      <th className="text-left px-4 py-4 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-cyan-600 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-sm font-bold">{u.displayName?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{u.displayName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-mono text-xs">{u.studentId ?? "—"}</td>
                        <td className="px-4 py-4 text-slate-500 text-xs">{timeAgo(u.createdAt)}</td>
                        <td className="px-4 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                            disabled={u.uid === profile?.uid}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer bg-white focus:outline-none",
                              u.role === "admin" ? "border-red-200 text-red-700 bg-red-50" :
                              u.role === "moderator" ? "border-amber-200 text-amber-700 bg-amber-50" :
                              "border-cyan-200 text-cyan-700 bg-cyan-50"
                            )}
                          >
                            <option value="student">student</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          {u.uid !== profile?.uid && (
                            <button
                              onClick={() => handleToggleActive(u.uid, u.isActive)}
                              className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
                                u.isActive
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              )}
                            >
                              {u.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                              {u.isActive ? "Active" : "Inactive"}
                            </button>
                          )}
                          {u.uid === profile?.uid && (
                            <span className="text-xs text-slate-400">You</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}