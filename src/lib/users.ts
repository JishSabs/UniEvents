import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

const COL = "users";

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, COL, uid), { role, updatedAt: serverTimestamp() });
}

export async function toggleUserActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COL, uid), { isActive, updatedAt: serverTimestamp() });
}
