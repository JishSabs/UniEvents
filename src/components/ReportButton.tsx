/**
 * NEW FILE: src/components/ReportButton.tsx
 *
 * Drop this into a MarketplaceListing card, a chat header, or a user's
 * profile to let a student report it. Follows your existing pattern of
 * client components + react-hot-toast for feedback (see CreateListingModal.tsx).
 */
"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { createReport } from "@/lib/reports";
import { ReportReason, ReportedItemType } from "@/types";

interface ReportButtonProps {
  itemType: ReportedItemType;
  itemId: string;
  reportedUserId: string;
}

const REASON_LABELS: Record<ReportReason, string> = {
  scam_or_fraud: "Scam or fraud",
  inappropriate_content: "Inappropriate content",
  fake_listing: "Fake or misleading listing",
  harassment: "Harassment or abuse",
  other: "Other",
};

export default function ReportButton({ itemType, itemId, reportedUserId }: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("scam_or_fraud");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user) {
      toast.error("You need to be signed in to report something.");
      return;
    }
    if (user.uid === reportedUserId) {
      toast.error("You can't report your own post.");
      return;
    }
    setSubmitting(true);
    try {
      await createReport(user.uid, itemType, itemId, reportedUserId, reason, details);
      toast.success("Report submitted. An admin will review it shortly.");
      setOpen(false);
      setDetails("");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
        aria-label="Report this listing"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Report this {itemType}</h3>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <label className="block text-sm text-gray-700 mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
            >
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-700 mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
              placeholder="What happened?"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}