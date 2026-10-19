/**
 * NEW FILE: src/components/RatingStars.tsx
 *
 * Two uses:
 *  1. <RatingStars mode="input" onSubmit={...} />   — inside the transaction
 *     chat page once a transaction's status becomes "ended", to collect a rating.
 *  2. <RatingStars mode="display" value={4.6} count={12} />  — on a listing
 *     card or profile page to show a user's existing average rating.
 */
"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface DisplayProps {
  mode: "display";
  value: number; // average stars, e.g. 4.6
  count: number; // total number of ratings
}

interface InputProps {
  mode: "input";
  onSubmit: (stars: number, comment: string) => Promise<void> | void;
}

type RatingStarsProps = DisplayProps | InputProps;

export default function RatingStars(props: RatingStarsProps) {
  if (props.mode === "display") {
    const { value, count } = props;
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className="font-medium text-gray-900">{count > 0 ? value.toFixed(1) : "New"}</span>
        {count > 0 && <span className="text-gray-400">({count})</span>}
      </div>
    );
  }

  return <RatingInput onSubmit={props.onSubmit} />;
}

function RatingInput({ onSubmit }: { onSubmit: InputProps["onSubmit"] }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(stars, comment);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-sm text-green-600">Thanks for rating this transaction.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-900 mb-2">How was this transaction?</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-6 h-6 ${
                (hovered || stars) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional comment"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
      />
      <button
        onClick={handleSubmit}
        disabled={stars === 0 || submitting}
        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit rating"}
      </button>
    </div>
  );
}