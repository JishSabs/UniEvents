"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Megaphone, ShoppingBag, Shield, Users, ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      color: "bg-indigo-600",
      iconColor: "text-white",
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
      color: "bg-indigo-600",
      iconColor: "text-white",
      title: "Marketplace",
      desc: "Buy textbooks, find tutors, sell clothes, or offer your skills to the campus community.",
      href: "/marketplace",
    },
    {
      icon: Users,
      color: "bg-slate-700",
      iconColor: "text-slate-200",
      title: "Hire & Get Hired",
      desc: "Post gigs, find freelancers, or build your campus reputation by offering your skills.",
      href: "/marketplace?type=job",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-white text-slate-900 pt-20 pb-32 px-4 relative overflow-hidden border-b border-slate-100">
        {/* Hub-and-spoke backdrop — the four campus areas radiating from the headline */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="400" y1="180" x2="120" y2="60" stroke="#4f46e5" strokeWidth="1" />
          <line x1="400" y1="180" x2="680" y2="60" stroke="#4f46e5" strokeWidth="1" />
          <line x1="400" y1="180" x2="100" y2="330" stroke="#64748b" strokeWidth="1" />
          <line x1="400" y1="180" x2="700" y2="340" stroke="#64748b" strokeWidth="1" />
          <circle cx="400" cy="180" r="4" fill="#4f46e5" />
          <circle cx="120" cy="60" r="3" fill="#4f46e5" />
          <circle cx="680" cy="60" r="3" fill="#4f46e5" />
          <circle cx="100" cy="330" r="3" fill="#64748b" />
          <circle cx="700" cy="340" r="3" fill="#64748b" />
        </svg>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-2 mb-8 text-sm text-indigo-700">
            <GraduationCap size={15} />
            Your campus, all in one place
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            The Official <span className="text-indigo-600">Campus Hub</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stay connected with official university announcements, discover student events,
            buy & sell, and hire fellow students — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/announcements" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Browse Announcements <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/auth/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Join UniEvents <ArrowRight size={18} />
                </Link>
                <Link href="/auth/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {user ? (
        /* Feature cards — signed-in users only */
        <section className="max-w-6xl mx-auto px-4 -mt-16 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-40">
            {features.map(({ icon: Icon, color, iconColor, title, desc, href }) => (
              <Link key={href} href={href} className="card-hover block">
                <Card className="h-full">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        /* Logged-out: preview of what's inside, without linking into gated pages */
        <section className="max-w-6xl mx-auto px-4 -mt-16 pb-20">
          <Card padding="lg" className="shadow-lg mt-40">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Sparkles size={16} className="text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]">What&apos;s waiting inside</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, color, iconColor, title, desc }) => (
                <div key={title}>
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">Sign up with your student email to unlock all of it.</p>
              <Link
                href="/auth/register"
                className={cn(buttonVariants({ variant: "primary" }), "shrink-0")}
              >
                Join UniEvents <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* How it works */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">
            How UniEvents Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register with your student email", desc: "Sign up using your university email to verify you're part of the community." },
              { step: "02", title: "Post, browse & connect", desc: "Share announcements, list products/services, or browse what other students are offering." },
              { step: "03", title: "Moderated for quality", desc: "Student posts go through quick moderation to keep the platform safe and relevant." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
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
