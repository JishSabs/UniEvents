"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, isModerator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isModerator) {
      router.push("/");
    }
  }, [loading, isModerator, router]);

  if (loading || !isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2 size={32} className="animate-spin text-[#0f2d6b]" />
          <p className="text-sm text-slate-600">Checking access to the admin panel...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
