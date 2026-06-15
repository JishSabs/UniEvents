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
  // Students need approval; admins/moderators are auto-approved
  const isOfficial = data.source === "official";
  const status: PostStatus =
    data.authorRole === "admin" || data.authorRole === "moderator"
      ? "approved"
      : "pending";

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
  const constraints: Parameters<typeof query>[1][] = [
    where("status", "==", "approved"),
    orderBy("isPinned", "desc"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];

  if (filterSource) constraints.splice(1, 0, where("source", "==", filterSource));
  if (filterCategory) constraints.splice(1, 0, where("category", "==", filterCategory));
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
