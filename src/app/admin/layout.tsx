"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, isModerator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isModerator) {
      router.push("/");
    }
  }, [loading, isModerator, router]);

  if (loading || !isModerator) {
    return <LoadingScreen message="Checking access to the admin panel..." />;
  }

  return <>{children}</>;
}
