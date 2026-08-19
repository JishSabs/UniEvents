import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
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

// --- Messages ---
export async function sendMessage(
  transactionId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const messagesCol = collection(db, COL, transactionId, "messages");
  await addDoc(messagesCol, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });
}

export async function sendMessageWithPreview(
  transactionId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const messagesCol = collection(db, COL, transactionId, "messages");
  await addDoc(messagesCol, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });

  // update parent transaction preview fields
  const txRef = doc(db, COL, transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) return;
  const tx = txSnap.data() as any;
  const isSenderBuyer = senderId === tx.buyerId;
  const updates: any = {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (isSenderBuyer) {
    updates.unreadSeller = true;
  } else {
    updates.unreadBuyer = true;
  }
  await updateDoc(txRef, updates);
}

export function subscribeToMessages(
  transactionId: string,
  callback: (msgs: any[]) => void
) {
  const messagesCol = collection(db, COL, transactionId, "messages");
  const q = query(messagesCol, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(msgs as any[]);
  });
}

export async function markMessagesRead(transactionId: string, userId: string): Promise<void> {
  const txRef = doc(db, COL, transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) return;
  const tx = txSnap.data() as any;
  const updates: any = {};
  if (userId === tx.buyerId) updates.unreadBuyer = false;
  if (userId === tx.sellerId) updates.unreadSeller = false;
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = serverTimestamp();
    await updateDoc(txRef, updates);
  }
}

export async function getUserInbox(userId: string): Promise<any[]> {
  const [asBuyer, asSeller] = await Promise.all([
    getDocs(query(collection(db, COL), where("buyerId", "==", userId))),
    getDocs(query(collection(db, COL), where("sellerId", "==", userId))),
  ]);
  const all = [
    ...asBuyer.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    ...asSeller.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
  ];
  return all
    .map((t) => ({
      ...t,
      lastMessageAt: t.lastMessageAt ? t.lastMessageAt : t.updatedAt,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
      const bTime = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
      return bTime - aTime;
    });
}