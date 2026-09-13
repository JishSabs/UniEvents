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
import { getActiveListingCount } from "@/lib/marketplace";
import { Announcement, UserProfile, UserRole } from "@/types";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import { cn, timeAgo } from "@/lib/utils";
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
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type Tab = "overview" | "pending" | "users";

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

  useEffect(() => {
    const loadOverview = async () => {
      setLoadingPending(true);
      setLoadingUsers(true);
      try {
        const [pendingResult, totalUsers, approvedAnnouncements, activeListings] = await Promise.all([
          getPendingAnnouncements(),
          getAllUsersCount(),
          getApprovedAnnouncementCount(),
          getActiveListingCount(),
        ]);

        setPendingCount(pendingResult.length);
        setTotalUserCount(totalUsers);
        setApprovedAnnouncementCount(approvedAnnouncements);
        setActiveListingCount(activeListings);
      } finally {
        setLoadingPending(false);
        setLoadingUsers(false);
      }
    };

    loadOverview();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === "pending") loadPending();
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

  if (!isModerator) return null;

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pending", label: "Pending Posts", icon: Clock, badge: pendingCount || undefined },
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-500 bg-amber-50", action: () => setTab("pending") },
              { label: "Total Users", value: totalUserCount, icon: Users, color: "text-cyan-600 bg-cyan-50", action: isAdmin ? () => setTab("users") : undefined },
              { label: "Active Listings", value: activeListingCount, icon: ShoppingBag, color: "text-slate-600 bg-slate-100" },
              { label: "Approved Announcements", value: approvedAnnouncementCount, icon: Shield, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, action }) => (
              <button
                key={label}
                onClick={action}
                disabled={!action}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200 p-6 text-left transition-shadow",
                  action ? "hover:shadow-md cursor-pointer" : "cursor-default"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", color)}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1 capitalize">{value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{label}</p>
                  {action && <ChevronRight size={14} className="text-slate-400" />}
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

      {/* Pending */}
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
