/**
 * NEW FILE: src/lib/reports.ts
 * Follows the same pattern as your existing src/lib/announcements.ts
 */
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report, ReportReason, ReportedItemType, ReportStatus } from "@/types";

const COL = "reports";

/**
 * File a new report. Called from the ReportButton component.
 */
export async function createReport(
  reporterId: string,
  itemType: ReportedItemType,
  itemId: string,
  reportedUserId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  await addDoc(collection(db, COL), {
    reporterId,
    itemType,
    itemId,
    reportedUserId,
    reason,
    details: details ?? "",
    status: "pending" as ReportStatus,
    createdAt: serverTimestamp(),
  });
}

/**
 * Admin: fetch all reports currently awaiting review.
 */
export async function getPendingReports(): Promise<Report[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Report[];
}

export async function getPendingReportsCount(): Promise<number> {
  const snap = await getDocs(query(collection(db, COL), where("status", "==", "pending")));
  return snap.size;
}

/**
 * Admin: mark a report resolved (action was taken, e.g. listing removed / user banned).
 */
export async function resolveReport(reportId: string, adminUid: string): Promise<void> {
  await updateDoc(doc(db, COL, reportId), {
    status: "resolved" as ReportStatus,
    resolvedAt: serverTimestamp(),
    resolvedBy: adminUid,
  });
}

/**
 * Admin: dismiss a report (reviewed, no action needed).
 */
export async function dismissReport(reportId: string, adminUid: string): Promise<void> {
  await updateDoc(doc(db, COL, reportId), {
    status: "dismissed" as ReportStatus,
    resolvedAt: serverTimestamp(),
    resolvedBy: adminUid,
  });
}

/**
 * Check how many times a specific user has been reported in total.
 * Useful for surfacing repeat offenders in the admin dashboard.
 */
export async function getReportCountForUser(reportedUserId: string): Promise<number> {
  const snap = await getDocs(
    query(collection(db, COL), where("reportedUserId", "==", reportedUserId))
  );
  return snap.size;
}