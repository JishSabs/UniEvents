"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { subscribeToStudentVerification } from "@/lib/studentVerification";

export default function StudentVerificationBadge({
  userId,
}: {
  userId: string;
}) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setVerified(null);
    return subscribeToStudentVerification(userId, setVerified);
  }, [userId]);

  // No verification record means this author isn't identified as a student.
  if (verified === null) return null;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        verified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <ShieldCheck size={11} />
      {verified ? "Verified student" : "Unverified student"}
    </span>
  );
}