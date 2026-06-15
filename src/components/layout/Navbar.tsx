"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
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

const navLinks = [
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
];

export default function Navbar() {
  const { user, profile, logout, isAdmin, isModerator } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f2d6b] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-[#f5a623] flex items-center justify-center">
              <span className="text-[#0f2d6b] font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                U
              </span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight hidden sm:block"
              style={{ fontFamily: "var(--font-display)" }}>
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
                    ? "bg-white/20 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
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
                    ? "bg-[#f5a623] text-[#0f2d6b]"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
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
                <button className="relative p-2 text-blue-200 hover:text-white transition-colors">
                  <Bell size={18} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#f5a623] flex items-center justify-center">
                      <span className="text-[#0f2d6b] text-xs font-bold">
                        {profile?.displayName?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <span className="text-white text-sm hidden sm:block max-w-24 truncate">
                      {profile?.displayName}
                    </span>
                    <ChevronDown size={14} className="text-blue-200" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{profile?.email}</p>
                        <span className={cn(
                          "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          profile?.role === "admin" ? "bg-red-100 text-red-700" :
                          profile?.role === "moderator" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {profile?.role}
                        </span>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User size={14} /> My Profile
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
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
                <Link href="/auth/login" className="text-blue-200 hover:text-white text-sm font-medium px-3 py-1.5">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-[#f5a623] text-[#0f2d6b] text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-blue-200 hover:text-white"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a2158] border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white text-sm"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          {isModerator && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-300 hover:bg-white/10 text-sm"
            >
              <LayoutDashboard size={16} /> {isAdmin ? "Admin Panel" : "Moderation"}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
