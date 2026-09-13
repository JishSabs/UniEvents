import Link from "next/link";
import { GraduationCap, Megaphone, ShoppingBag } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-sm">UniEvents</p>
              <p className="text-slate-400 text-xs">The official campus hub</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/announcements" className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors">
              <Megaphone size={14} /> Announcements
            </Link>
            <Link href="/marketplace" className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors">
              <ShoppingBag size={14} /> Marketplace
            </Link>
            <span className="flex items-center gap-1.5 text-slate-400">
              <GraduationCap size={14} /> Campus-verified only
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center sm:text-left">
          © {new Date().getFullYear()} UniEvents. Built for students, by students.
        </div>
      </div>
    </footer>
  );
}
