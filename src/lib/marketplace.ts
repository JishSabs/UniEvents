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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MarketplaceListing, ListingType, ListingStatus } from "@/types";

const COL = "marketplace";

// ─── Create ──────────────────────────────────────────────────────────────────

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
    limit(effectivePageSize),
  ];

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  let listings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));

  listings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  if (filterType) {
    listings = listings.filter((listing) => listing.type === filterType);
  }
  if (filterCategory) {
    listings = listings.filter((listing) => listing.category === filterCategory);
  }

  return listings;
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

// ─── Update / Delete ──────────────────────────────────────────────────────────

export async function closeListing(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { status: "sold", updatedAt: serverTimestamp() });
}

export async function deleteListing(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { status: "deleted", updatedAt: serverTimestamp() });
}

export async function updateListing(
  id: string,
  data: Partial<MarketplaceListing>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}
