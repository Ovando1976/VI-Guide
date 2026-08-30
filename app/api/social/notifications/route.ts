import type { NextRequest } from "next/server";

import {
  listSocialNotifications,
  markAllSocialNotificationsRead,
  markSocialNotificationRead,
  unreadSocialNotificationCount,
} from "@/lib/social/notification-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit, cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 40, 100);
    const [notifications, unreadCount] = await Promise.all([
      listSocialNotifications(identity.uid, limit),
      unreadSocialNotificationCount(identity.uid),
    ]);
    return socialJson({ notifications, unreadCount });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    if (body.all === true) {
      const count = await markAllSocialNotificationsRead(identity.uid);
      return socialJson({ ok: true, count });
    }
    const notificationId = cleanSocialText(body.notificationId, 160);
    if (!notificationId) throw new Error("Notification is required.");
    await markSocialNotificationRead(identity.uid, notificationId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
