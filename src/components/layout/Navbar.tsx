"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  Megaphone,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import type { Notification } from "@/types";
import {
  markAllNotificationsRead,
  markNotificationRead,
  processDueEventReminders,
  subscribeToNotifications,
} from "@/lib/notifications";
import toast from "react-hot-toast";

const navLinks = [
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
];

export default function Navbar() {
  const { user, profile, logout, isAdmin, isModerator } = useAuth();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const userId = user?.uid;
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setNotificationsOpen(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(userId, setNotifications);
    let processing = false;

    const checkReminders = async () => {
      if (processing) return;
      processing = true;

      try {
        await processDueEventReminders(userId);
      } catch (error) {
        console.error("Could not process event reminders:", error);
      } finally {
        processing = false;
      }
    };

    void checkReminders();

    const timer = window.setInterval(() => {
      void checkReminders();
    }, 60_000);

    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(notifications);
    } catch (error) {
      console.error(error);
      toast.error("Could not update notifications.");
    }
  };

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
      }

      setNotificationsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Could not update this notification.");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b transition-shadow duration-200",
        scrolled ? "border-slate-200 shadow-sm" : "border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 shadow-sm shadow-cyan-600/30 flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-slate-900 font-semibold text-lg tracking-tight hidden sm:block">
              UniEvents
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}

            {isModerator && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <LayoutDashboard size={16} />
                {isAdmin ? "Admin" : "Moderation"}
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen((open) => !open)
                    }
                    aria-label={`Notifications${
                      unreadCount ? `, ${unreadCount} unread` : ""
                    }`}
                    aria-expanded={notificationsOpen}
                    className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Bell size={18} />

                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          Notifications
                        </p>

                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void handleMarkAllRead()}
                            className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-500">
                            You have no notifications.
                          </p>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              onClick={() =>
                                void handleNotificationClick(notification)
                              }
                              className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 ${
                                notification.isRead
                                  ? "bg-white"
                                  : "bg-cyan-50"
                              }`}
                            >
                              <span className="block text-sm font-semibold text-slate-800">
                                {notification.title}
                              </span>
                              <span className="mt-1 block text-xs text-slate-600">
                                {notification.message}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {profile?.displayName?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>

                    <span className="text-slate-700 text-sm hidden sm:block max-w-24 truncate">
                      {profile?.displayName}
                    </span>

                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">
                          Signed in as
                        </p>
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {profile?.email}
                        </p>

                        <Badge
                          variant={
                            profile?.role === "admin"
                              ? "danger"
                              : profile?.role === "moderator"
                                ? "warning"
                                : "accent"
                          }
                          className="mt-1"
                        >
                          {profile?.role}
                        </Badge>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User size={14} /> My Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5"
                >
                  Sign In
                </Link>

                <Link
                  href="/auth/register"
                  className={buttonVariants({
                    variant: "primary",
                    size: "sm",
                  })}
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-sm"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}

          {isModerator && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cyan-600 hover:bg-cyan-50 text-sm"
            >
              <LayoutDashboard size={16} />
              {isAdmin ? "Admin Panel" : "Moderation"}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}