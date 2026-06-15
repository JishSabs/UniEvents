"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Megaphone, ShoppingBag, Shield, Users, ArrowRight, GraduationCap } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-[#0f2d6b] text-white pt-20 pb-32 px-4 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #f5a623 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0d9488 0%, transparent 40%)" }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-8 text-sm text-blue-200">
            <GraduationCap size={15} />
            Your campus, all in one place
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}>
            The Official <span className="text-[#f5a623]">Campus Hub</span>
          </h1>
          <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stay connected with official university announcements, discover student events,
            buy & sell, and hire fellow students — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                href="/announcements"
                className="flex items-center justify-center gap-2 bg-[#f5a623] text-[#0f2d6b] font-semibold px-8 py-3.5 rounded-xl hover:bg-amber-400 transition-colors"
              >
                Browse Announcements <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="flex items-center justify-center gap-2 bg-[#f5a623] text-[#0f2d6b] font-semibold px-8 py-3.5 rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Join UniEvents <ArrowRight size={18} />
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-4 -mt-16 pb-20" >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-40">
          {[
            {
              icon: Shield,
              color: "bg-[#0f2d6b]",
              iconColor: "text-[#f5a623]",
              title: "Official Announcements",
              desc: "Important notices directly from the university — exam schedules, fee deadlines, policy updates.",
              href: "/announcements?source=official",
            },
            {
              icon: Megaphone,
              color: "bg-slate-700",
              iconColor: "text-slate-200",
              title: "Student Posts",
              desc: "Parties, gigs, clubs, study groups — all the happenings from your fellow students.",
              href: "/announcements?source=student",
            },
            {
              icon: ShoppingBag,
              color: "bg-[#0d9488]",
              iconColor: "text-white",
              title: "Marketplace",
              desc: "Buy textbooks, find tutors, sell clothes, or offer your skills to the campus community.",
              href: "/marketplace",
            },
            {
              icon: Users,
              color: "bg-[#7c3aed]",
              iconColor: "text-white",
              title: "Hire & Get Hired",
              desc: "Post gigs, find freelancers, or build your campus reputation by offering your skills.",
              href: "/marketplace?type=job",
            },
          ].map(({ icon: Icon, color, iconColor, title, desc, href }) => (
            <Link key={href} href={href} className="card-hover block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12" style={{ fontFamily: "var(--font-display)" }}>
            How UniEvents Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register with your student email", desc: "Sign up using your university email to verify you're part of the community." },
              { step: "02", title: "Post, browse & connect", desc: "Share announcements, list products/services, or browse what other students are offering." },
              { step: "03", title: "Moderated for quality", desc: "Student posts go through quick moderation to keep the platform safe and relevant." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-[#0f2d6b] text-[#f5a623] rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4"
                  style={{ fontFamily: "var(--font-display)" }}>
                  {step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
