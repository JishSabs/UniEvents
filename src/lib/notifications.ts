import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Notification, NotificationType } from "@/types";

const NOTIFICATIONS = "notifications";
const EVENT_REMINDERS = "eventReminders";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export type NotificationDraft = {
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
};

export function subscribeToNotifications(
  userId: string,
  onChange: (notifications: Notification[]) => void
) {
  const notificationsQuery = query(
    collection(db, NOTIFICATIONS),
    where("userId", "==", userId)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map(
        (item) => ({ id: item.id, ...item.data() }) as Notification
      );

      notifications.sort((a, b) => {
        const aTime =
          a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const bTime =
          b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      onChange(notifications);
    },
    (error) => {
      console.error("Could not load notifications:", error);
    }
  );
}

export async function createNotificationForUser(
  userId: string,
  notification: NotificationDraft
) {
  await addDoc(collection(db, NOTIFICATIONS), {
    userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: false,
    ...(notification.relatedId
      ? { relatedId: notification.relatedId }
      : {}),
    createdAt: serverTimestamp(),
  });
}

export async function notifyActiveStudents(
  notification: NotificationDraft
) {
  const students = await getDocs(
    query(collection(db, "users"), where("role", "==", "student"))
  );

  const studentIds = students.docs
    .filter((student) => student.data().isActive === true)
    .map((student) => student.id);

  for (let start = 0; start < studentIds.length; start += 450) {
    const batch = writeBatch(db);

    for (const userId of studentIds.slice(start, start + 450)) {
      const notificationRef = doc(collection(db, NOTIFICATIONS));

      batch.set(notificationRef, {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: false,
        ...(notification.relatedId
          ? { relatedId: notification.relatedId }
          : {}),
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, NOTIFICATIONS, notificationId), {
    isRead: true,
  });
}

export async function markAllNotificationsRead(
  notifications: Notification[]
) {
  const unread = notifications.filter((notification) => !notification.isRead);

  for (let start = 0; start < unread.length; start += 450) {
    const batch = writeBatch(db);

    for (const notification of unread.slice(start, start + 450)) {
      batch.update(doc(db, NOTIFICATIONS, notification.id), {
        isRead: true,
      });
    }

    await batch.commit();
  }
}

function reminderDocumentId(userId: string, announcementId: string) {
  return `${encodeURIComponent(userId)}__${encodeURIComponent(announcementId)}`;
}

export function subscribeToEventReminder(
  userId: string,
  announcementId: string,
  onChange: (isSet: boolean) => void
) {
  const reminderRef = doc(
    db,
    EVENT_REMINDERS,
    reminderDocumentId(userId, announcementId)
  );

  return onSnapshot(
    reminderRef,
    (snapshot) => onChange(snapshot.exists()),
    (error) => {
      console.error("Could not load event reminder:", error);
    }
  );
}

export async function setEventReminder(
  userId: string,
  announcementId: string,
  eventTitle: string,
  eventDate: Timestamp
) {
  const timeUntilEvent = eventDate.toMillis() - Date.now();

  if (timeUntilEvent <= HOUR_MS) {
    throw new Error("Set a reminder at least one hour before the event.");
  }

  const reminderRef = doc(
    db,
    EVENT_REMINDERS,
    reminderDocumentId(userId, announcementId)
  );

  await setDoc(reminderRef, {
    userId,
    announcementId,
    eventTitle,
    eventDate,
    // Skip the 24-hour reminder if the user sets this less than a day
    // before the event.
    sent24h: timeUntilEvent <= DAY_MS,
    sent1h: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function removeEventReminder(
  userId: string,
  announcementId: string
) {
  await deleteDoc(
    doc(
      db,
      EVENT_REMINDERS,
      reminderDocumentId(userId, announcementId)
    )
  );
}

export async function processDueEventReminders(userId: string) {
  const reminders = await getDocs(
    query(
      collection(db, EVENT_REMINDERS),
      where("userId", "==", userId)
    )
  );

  for (const reminderSnapshot of reminders.docs) {
    await runTransaction(db, async (transaction) => {
      const currentSnapshot = await transaction.get(reminderSnapshot.ref);
      if (!currentSnapshot.exists()) return;

      const reminder = currentSnapshot.data();

      if (!(reminder.eventDate instanceof Timestamp)) {
        return;
      }

      const remaining = reminder.eventDate.toMillis() - Date.now();

      // Do not send an old reminder after the event has started.
      if (remaining <= 0) {
        if (!reminder.sent24h || !reminder.sent1h) {
          transaction.update(reminderSnapshot.ref, {
            sent24h: true,
            sent1h: true,
            updatedAt: serverTimestamp(),
          });
        }
        return;
      }

      const send24h =
        reminder.sent24h !== true &&
        remaining <= DAY_MS &&
        remaining > HOUR_MS;

      const send1h =
        reminder.sent1h !== true &&
        remaining <= HOUR_MS;

      if (!send24h && !send1h) return;

      const updates: {
        sent24h?: boolean;
        sent1h?: boolean;
        updatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        updatedAt: serverTimestamp(),
      };

      if (send24h) updates.sent24h = true;
      if (send1h) updates.sent1h = true;

      transaction.update(reminderSnapshot.ref, updates);

      const notificationRef = doc(collection(db, NOTIFICATIONS));
      const reminderLabel = send24h ? "24-hour" : "1-hour";

      transaction.set(notificationRef, {
        userId,
        type: "event_reminder",
        title: `${reminderLabel} event reminder`,
        message: `Your event “${reminder.eventTitle}” is coming up.`,
        isRead: false,
        relatedId: reminder.announcementId,
        createdAt: serverTimestamp(),
      });
    });
  }
}