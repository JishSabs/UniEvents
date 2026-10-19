import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
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
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementSource,
  PostStatus,
  UserRole,
} from "@/types";
import {
  createNotificationForUser,
  notifyActiveStudents,
} from "@/lib/notifications";

const COL = "announcements";

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createAnnouncement(
  data: Omit<
    Announcement,
    "id" | "createdAt" | "updatedAt" | "viewCount" | "status" | "isPinned"
  > & { authorRole: UserRole }
): Promise<string> {
  const status: PostStatus =
    data.authorRole === "student" ? "pending" : "approved";

  const docRef = await addDoc(collection(db, COL), {
    ...data,
    status,
    isPinned: false,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (status === "approved" && data.source === "official") {
    await notifyActiveStudents({
      type: "new_announcement",
      title: "New university announcement",
      message: data.title,
      relatedId: docRef.id,
    });
  }

  return docRef.id;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getApprovedAnnouncements(
  filterSource?: AnnouncementSource,
  filterCategory?: AnnouncementCategory,
  pageSize = 20,
  lastDoc?: DocumentSnapshot
): Promise<Announcement[]> {
  const effectivePageSize =
    filterSource || filterCategory ? Math.max(pageSize, 100) : pageSize;

  const constraints: Parameters<typeof query>[1][] = [
    where("status", "==", "approved"),
  ];

  if (filterSource) {
    constraints.push(where("source", "==", filterSource));
  }

  if (filterCategory) {
    constraints.push(where("category", "==", filterCategory));
  }

  constraints.push(
    orderBy("isPinned", "desc"),
    orderBy("createdAt", "desc"),
    limit(effectivePageSize)
  );

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const snap = await getDocs(query(collection(db, COL), ...constraints));

  return snap.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as Announcement
  );
}

export async function getPendingAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    )
  );

  return snap.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as Announcement
  );
}

export async function getApprovedAnnouncementCount(): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, COL), where("status", "==", "approved"))
  );

  return snap.data().count;
}

export async function getUserAnnouncements(
  userId: string
): Promise<Announcement[]> {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );

  return snap.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as Announcement
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function approveAnnouncement(
  id: string,
  approvedBy: string
): Promise<void> {
  const announcementRef = doc(db, COL, id);
  const existing = await getDoc(announcementRef);

  if (!existing.exists()) {
    throw new Error("Announcement not found.");
  }

  const announcement = existing.data() as Announcement;
  const wasPending = announcement.status === "pending";

  await updateDoc(announcementRef, {
    status: "approved",
    approvedBy,
    updatedAt: serverTimestamp(),
  });

  if (
    wasPending &&
    announcement.source === "student" &&
    announcement.authorId
  ) {
    await createNotificationForUser(announcement.authorId, {
      type: "announcement_approved",
      title: "Your post was approved",
      message: announcement.title,
      relatedId: id,
    });
  }
}

export async function rejectAnnouncement(
  id: string,
  reason: string
): Promise<void> {
  const announcementRef = doc(db, COL, id);
  const existing = await getDoc(announcementRef);

  if (!existing.exists()) {
    throw new Error("Announcement not found.");
  }

  const announcement = existing.data() as Announcement;
  const wasPending = announcement.status === "pending";

  await updateDoc(announcementRef, {
    status: "rejected",
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });

  if (
    wasPending &&
    announcement.source === "student" &&
    announcement.authorId
  ) {
    await createNotificationForUser(announcement.authorId, {
      type: "announcement_rejected",
      title: "Your post was rejected",
      message: reason
        ? `${announcement.title}: ${reason}`
        : announcement.title,
      relatedId: id,
    });
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "deleted",
    updatedAt: serverTimestamp(),
  });
}

export async function pinAnnouncement(
  id: string,
  pinned: boolean
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    isPinned: pinned,
    updatedAt: serverTimestamp(),
  });
}

export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    viewCount: increment(1),
  });
}