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
  const constraints: Parameters<typeof query>[1][] = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];

  if (filterType) constraints.splice(1, 0, where("type", "==", filterType));
  if (filterCategory) constraints.splice(1, 0, where("category", "==", filterCategory));

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));
}

export async function getUserListings(userId: string): Promise<MarketplaceListing[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("authorId", "==", userId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceListing));
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
