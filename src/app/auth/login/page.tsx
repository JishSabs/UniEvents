"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push("/announcements");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        toast.error("Invalid email or password");
      } else if (msg.includes("account-disabled")) {
        toast.error("Your account is inactive. Please contact support.");
      } else if (msg.includes("No user profile found")) {
        toast.error("Account profile missing. Please contact support.");
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0f2d6b] px-8 py-10 text-center">
            <div className="w-14 h-14 bg-[#f5a623] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0f2d6b] text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>U</span>
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Welcome Back
            </h1>
            <p className="text-blue-300 text-sm mt-2">Sign in to your UniEvents account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.ac.zw"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/20 focus:border-[#0f2d6b] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d6b]/20 focus:border-[#0f2d6b] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f2d6b] text-white rounded-xl font-medium hover:bg-[#1a3e8a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-[#0f2d6b] font-medium hover:underline">
                Register here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
