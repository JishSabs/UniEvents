/**
 * NEW FILE: src/lib/ratings.ts
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Rating, RatingSummary } from "@/types";

const COL = "ratings";

/**
 * Submit a rating for the other party once a transaction has ended.
 * Call this from the transaction chat page (transactions/[id]/page.tsx)
 * after the transaction's status becomes "ended".
 */
export async function submitRating(
  transactionId: string,
  raterId: string,
  ratedUserId: string,
  stars: number,
  comment?: string
): Promise<void> {
  if (stars < 1 || stars > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }
  await addDoc(collection(db, COL), {
    transactionId,
    raterId,
    ratedUserId,
    stars,
    comment: comment ?? "",
    createdAt: serverTimestamp(),
  });
}

/**
 * Get every rating a specific user has received (e.g. to show on their profile
 * or next to their listings).
 */
export async function getRatingsForUser(ratedUserId: string): Promise<Rating[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("ratedUserId", "==", ratedUserId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Rating[];
}

/**
 * Compute a lightweight average + count summary, e.g. "4.6 (12 ratings)"
 * for display on a listing card or profile page.
 */
export async function getUserRatingSummary(ratedUserId: string): Promise<RatingSummary> {
  const ratings = await getRatingsForUser(ratedUserId);
  if (ratings.length === 0) return { averageStars: 0, totalRatings: 0 };
  const total = ratings.reduce((sum, r) => sum + r.stars, 0);
  return {
    averageStars: Math.round((total / ratings.length) * 10) / 10,
    totalRatings: ratings.length,
  };
}

/**
 * Prevent a user rating the same transaction twice.
 * Call before showing the rating form.
 */
export async function hasAlreadyRated(transactionId: string, raterId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("transactionId", "==", transactionId),
      where("raterId", "==", raterId)
    )
  );
  return !snap.empty;
}