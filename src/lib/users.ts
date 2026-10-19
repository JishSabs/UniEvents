import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  getCountFromServer,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

const COL = "users";
const VERIFICATION_COL = "studentVerifications";

export type AdminUserProfile = UserProfile & {
  isVerifiedStudent: boolean;
};

export async function getAllUsers(): Promise<AdminUserProfile[]> {
  const [usersSnapshot, verificationSnapshot] = await Promise.all([
    getDocs(query(collection(db, COL), orderBy("createdAt", "desc"))),
    getDocs(collection(db, VERIFICATION_COL)),
  ]);

  const verificationByUser = new Map<
    string,
    { isStudent?: boolean; verified?: boolean }
  >();

  for (const verificationDoc of verificationSnapshot.docs) {
    verificationByUser.set(
      verificationDoc.id,
      verificationDoc.data() as { isStudent?: boolean; verified?: boolean }
    );
  }

  // Older student accounts may not have a verification record yet.
  // Create those records as unverified.
  const missingStudentIds = usersSnapshot.docs
    .filter(
      (userDoc) =>
        userDoc.data().role === "student" &&
        !verificationByUser.has(userDoc.id)
    )
    .map((userDoc) => userDoc.id);

  for (let start = 0; start < missingStudentIds.length; start += 450) {
    const batch = writeBatch(db);
    const ids = missingStudentIds.slice(start, start + 450);

    for (const uid of ids) {
      batch.set(doc(db, VERIFICATION_COL, uid), {
        isStudent: true,
        verified: false,
        createdAt: serverTimestamp(),
      });

      verificationByUser.set(uid, {
        isStudent: true,
        verified: false,
      });
    }

    await batch.commit();
  }

  return usersSnapshot.docs.map((userDoc) => {
    const userData = userDoc.data() as UserProfile;
    const verification = verificationByUser.get(userDoc.id);

    return {
      ...userData,
      uid: userData.uid || userDoc.id,
      isVerifiedStudent:
        verification?.isStudent === true && verification.verified === true,
    };
  });
}

export async function getAllUsersCount(): Promise<number> {
  const snapshot = await getCountFromServer(query(collection(db, COL)));
  return snapshot.data().count;
}

export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const batch = writeBatch(db);

  batch.update(doc(db, COL, uid), {
    role,
    updatedAt: serverTimestamp(),
  });

  // A role change resets verification. If the person becomes a student,
  // an admin must approve their verification again.
  batch.set(
    doc(db, VERIFICATION_COL, uid),
    {
      isStudent: role === "student",
      verified: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

export async function toggleUserActive(
  uid: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(doc(db, COL, uid), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}