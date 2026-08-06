import type { NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import type { NotificationAudience } from "@/types/notification";

export type NotificationIdentity = {
  uid: string;
  email: string | null;
  role: string;
};

export async function authenticateNotificationRequest(
  request: NextRequest,
): Promise<NotificationIdentity | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email:
        typeof decoded.email === "string"
          ? decoded.email.trim().toLowerCase().slice(0, 220)
          : null,
      role: typeof decoded.role === "string" ? decoded.role : "rider",
    };
  } catch {
    return null;
  }
}

export function canAccessNotificationAudience(
  identity: NotificationIdentity,
  audience: NotificationAudience,
) {
  if (audience === "traveler") return true;
  if (audience === "merchant") {
    return identity.role === "merchant" || identity.role === "admin";
  }
  return identity.role === "admin" || identity.role === "dispatcher";
}

export function canMutateStoredNotification(
  identity: NotificationIdentity,
  data: FirebaseFirestore.DocumentData,
) {
  const audience = data.audience;
  if (audience === "traveler") {
    return typeof data.recipientUid === "string" && data.recipientUid === identity.uid;
  }
  if (audience === "merchant") {
    return identity.role === "merchant" || identity.role === "admin";
  }
  if (audience === "operations") {
    return identity.role === "admin" || identity.role === "dispatcher";
  }
  return false;
}
