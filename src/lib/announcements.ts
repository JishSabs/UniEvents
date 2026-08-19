import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  limit,
  startAfter,
  getCountFromServer,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Announcement, AnnouncementCategory, AnnouncementSource, PostStatus, UserRole } from "@/types";

const COL = "announcements";

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  data: Omit<Announcement, "id" | "createdAt" | "updatedAt" | "viewCount" | "status" | "isPinned">
  & { authorRole: UserRole }
): Promise<string> {
  const status: PostStatus = data.authorRole === "student" ? "pending" : "approved";

  const docRef = await addDoc(collection(db, COL), {
    ...data,
    status,
    isPinned: false,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getApprovedAnnouncements(
  filterSource?: AnnouncementSource,
  filterCategory?: AnnouncementCategory,
  pageSize = 20,
  lastDoc?: DocumentSnapshot
): Promise<Announcement[]> {
  const effectivePageSize = filterSource || filterCategory ? Math.max(pageSize, 100) : pageSize;

  const constraints: Parameters<typeof query>[1][] = [
    where("status", "==", "approved"),
  ];

  if (filterSource) {
    constraints.push(where("source", "==", filterSource));
  }
  if (filterCategory) {
    constraints.push(where("category", "==", filterCategory));
  }

  constraints.push(orderBy("isPinned", "desc"), orderBy("createdAt", "desc"), limit(effectivePageSize));

  if (lastDoc) constraints.push(startAfter(lastDoc));

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
}

export async function getPendingAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("status", "==", "pending"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
}

export async function getApprovedAnnouncementCount(): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, COL), where("status", "==", "approved")));
  return snap.data().count;
}

export async function getUserAnnouncements(userId: string): Promise<Announcement[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("authorId", "==", userId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function approveAnnouncement(id: string, approvedBy: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "approved",
    approvedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectAnnouncement(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "rejected",
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "deleted",
    updatedAt: serverTimestamp(),
  });
}

export async function pinAnnouncement(id: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, COL, id), { isPinned: pinned, updatedAt: serverTimestamp() });
}

export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { viewCount: increment(1) });
}