import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";

const COL = "transactions";

export async function startTransaction(params: {
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, COL), {
    ...params,
    status: "active",
    buyerSharing: true,
    sellerSharing: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToTransaction(
  id: string,
  callback: (t: Transaction | null) => void
) {
  return onSnapshot(doc(db, COL, id), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Transaction);
  });
}

export async function updateMyLocation(
  id: string,
  role: "buyer" | "seller",
  lat: number,
  lng: number
): Promise<void> {
  const field = role === "buyer" ? "buyerLocation" : "sellerLocation";
  await updateDoc(doc(db, COL, id), {
    [field]: { lat, lng, updatedAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  });
}

export async function stopSharing(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "ended",
    buyerSharing: false,
    sellerSharing: false,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const [asBuyer, asSeller] = await Promise.all([
    getDocs(query(collection(db, COL), where("buyerId", "==", userId))),
    getDocs(query(collection(db, COL), where("sellerId", "==", userId))),
  ]);
  const all = [
    ...asBuyer.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)),
    ...asSeller.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)),
  ];
  return all.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}