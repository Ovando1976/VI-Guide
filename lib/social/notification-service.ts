import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { cleanSocialText, socialHash, socialNow } from "@/lib/social/utils";
import type { SocialNotification, SocialNotificationType } from "@/types/social";

const NOTIFICATIONS = "socialNotifications";

export type CreateNotificationInput = Readonly<{
  userId: string;
  type: SocialNotificationType;
  actorId?: string | null;
  title: string;
  body: string;
  href?: string | null;
  dedupeKey?: string;
}>;

export async function createSocialNotification(input: CreateNotificationInput) {
  if (input.actorId && input.actorId === input.userId && input.type !== "ai") return null;
  const db = getAdminDb();
  const now = socialNow();
  const id = input.dedupeKey
    ? `notification_${socialHash(input.userId, input.type, input.dedupeKey).slice(0, 36)}`
    : db.collection(NOTIFICATIONS).doc().id;
  const notification: SocialNotification = {
    version: 1,
    id,
    userId: input.userId,
    type: input.type,
    actorId: input.actorId ?? null,
    title: cleanSocialText(input.title, 120),
    body: cleanSocialText(input.body, 320),
    href: input.href ? cleanSocialText(input.href, 500) : null,
    readAt: null,
    createdAt: now,
  };
  await db.collection(NOTIFICATIONS).doc(id).set(notification, { merge: false });
  return notification;
}

export async function listSocialNotifications(userId: string, limit = 40) {
  const snapshot = await getAdminDb()
    .collection(NOTIFICATIONS)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(Math.max(1, Math.min(limit, 100)))
    .get();
  return snapshot.docs.map((doc) => doc.data() as SocialNotification);
}

export async function markSocialNotificationRead(userId: string, notificationId: string) {
  const db = getAdminDb();
  const ref = db.collection(NOTIFICATIONS).doc(notificationId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.userId !== userId) {
      throw new Error("Notification was not found.");
    }
    transaction.update(ref, { readAt: socialNow() });
  });
}

export async function markAllSocialNotificationsRead(userId: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection(NOTIFICATIONS)
    .where("userId", "==", userId)
    .where("readAt", "==", null)
    .limit(200)
    .get();
  const batch = db.batch();
  const now = socialNow();
  for (const doc of snapshot.docs) batch.update(doc.ref, { readAt: now });
  if (!snapshot.empty) await batch.commit();
  return snapshot.size;
}

export async function unreadSocialNotificationCount(userId: string) {
  const snapshot = await getAdminDb()
    .collection(NOTIFICATIONS)
    .where("userId", "==", userId)
    .where("readAt", "==", null)
    .count()
    .get();
  return snapshot.data().count;
}

export async function deleteNotificationsForTargetUser(userId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection(NOTIFICATIONS).where("userId", "==", userId).limit(500).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snapshot.empty) await batch.commit();
}
