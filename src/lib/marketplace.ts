/**
 * REPLACES your existing src/lib/marketplace.ts entirely.
 *
 * Corrections from the previous version I gave you:
 *  - COL is "marketplace", not "listings" (confirmed from your real file)
 *  - Your status lifecycle is "active" | "sold" | "deleted", not
 *    "approved"/"rejected" like announcements. I've extended it with
 *    "pending" and "rejected" rather than inventing a separate "approved"
 *    status, so it fits your existing naming instead of clashing with it.
 *  - Removed the duplicate imports / duplicate `const COL` that resulted
 *    from merging the two files together.
 *
 * You'll also need to update ListingStatus in src/types/index.ts:
 *   export type ListingStatus = "pending" | "active" | "sold" | "deleted" | "rejected";
 * (add "pending" and "rejected" to whatever it currently is)
 */
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MarketplaceListing, ListingType, ListingStatus } from "@/types";

const COL = "marketplace";

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * CHANGED: new listings now start as "pending" instead of "active", so they
 * enter a moderation queue first — same idea as how student announcements
 * already work. Update any UI copy ("Your listing is now live") that assumed
 * immediate posting.
 */
export async function createListing(
  data: Omit<MarketplaceListing, "id" | "createdAt" | "updatedAt" | "status">
): Promise<string> {
  const docRef = await addDoc(collection(db, COL), {
    ...data,
    status: "active" as ListingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getActiveListings(
  filterType?: ListingType,
  filterCategory?: string,
  pageSize = 20
): Promise<MarketplaceListing[]> {
  const effectivePageSize = filterType || filterCategory ? Math.max(pageSize, 100) : pageSize;
  const constraints: Parameters<typeof query>[1][] = [
    where("status", "==", "active"),
  ];

  if (filterType) {
    constraints.push(where("type", "==", filterType));
  }
  if (filterCategory) {
    constraints.push(where("category", "==", filterCategory));
  }

  constraints.push(orderBy("createdAt", "desc"), limit(effectivePageSize));

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));
}

export async function getUserListings(userId: string): Promise<MarketplaceListing[]> {
  const snap = await getDocs(query(collection(db, COL), where("authorId", "==", userId)));
  const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));

  return listings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function getActiveListingCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, COL), where("status", "==", "active")));
  return snap.data().count;
}

/**
 * NEW: admin moderation queue, same pattern as getPendingAnnouncements().
 */
export async function getPendingListings(): Promise<MarketplaceListing[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("status", "==", "pending"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));
}

export async function getPendingListingsCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, COL), where("status", "==", "pending")));
  return snap.data().count;
}

// ─── Update / Delete ──────────────────────────────────────────────────────────

export async function closeListing(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { status: "sold" as ListingStatus, updatedAt: serverTimestamp() });
}

export async function deleteListing(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { status: "deleted" as ListingStatus, updatedAt: serverTimestamp() });
}

export async function updateListing(
  id: string,
  data: Partial<MarketplaceListing>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

/**
 * NEW: admin approves a pending listing — moves it to "active" so it
 * appears in getActiveListings(). Mirrors approveAnnouncement().
 */
export async function approveListing(id: string, approvedBy: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "active" as ListingStatus,
    approvedBy,
    updatedAt: serverTimestamp(),
  });
}

/**
 * NEW: admin rejects a pending listing before it ever goes live.
 */
export async function rejectListing(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "rejected" as ListingStatus,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
}

/**
 * NEW: admin takes down a listing that was already live (e.g. after a
 * confirmed scam report), distinct from rejecting something still pending.
 */
export async function removeListing(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "rejected" as ListingStatus,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
}