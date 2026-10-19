import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION = "studentVerifications";

export function subscribeToStudentVerification(
  userId: string,
  onChange: (verified: boolean | null) => void
) {
  return onSnapshot(
    doc(db, COLLECTION, userId),
    (snapshot) => {
      if (!snapshot.exists() || snapshot.data().isStudent !== true) {
        onChange(null);
        return;
      }

      onChange(snapshot.data().verified === true);
    },
    (error) => {
      console.error("Could not load student verification status:", error);
      onChange(null);
    }
  );
}

export async function ensureStudentVerificationRecord(userId: string) {
  const verificationRef = doc(db, COLLECTION, userId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(verificationRef);

    if (!snapshot.exists()) {
      transaction.set(verificationRef, {
        isStudent: true,
        verified: false,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function setStudentVerification(
  userId: string,
  verified: boolean,
  adminId: string
) {
  const verificationRef = doc(db, COLLECTION, userId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(verificationRef);

    const verificationData = {
      isStudent: true,
      verified,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    };

    if (snapshot.exists()) {
      transaction.set(verificationRef, verificationData, { merge: true });
    } else {
      transaction.set(verificationRef, {
        ...verificationData,
        createdAt: serverTimestamp(),
      });
    }
  });
}