import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  processBookingNotificationOutboxIds,
  processDueBookingNotifications,
} from "@/lib/notifications/booking-notification-delivery";
import { reconcileRecentCommerceBookingNotifications } from "@/lib/notifications/commerce-booking-notification-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Notification delivery is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const db = getAdminDb();
    const reconciliation =
      await reconcileRecentCommerceBookingNotifications(db, 25);
    const recovered = {
      delivered: 0,
      deferred: 0,
      skipped: 0,
      failed: 0,
    };

    for (let index = 0; index < reconciliation.createdIds.length; index += 25) {
      const result = await processBookingNotificationOutboxIds(
        db,
        reconciliation.createdIds.slice(index, index + 25),
      );
      recovered.delivered += result.delivered;
      recovered.deferred += result.deferred;
      recovered.skipped += result.skipped;
      recovered.failed += result.failed;
    }

    const due = await processDueBookingNotifications(db, 25);
    return NextResponse.json({
      ok: true,
      reconciliation: {
        scannedBookings: reconciliation.scannedBookings,
        candidates: reconciliation.candidates,
        created: reconciliation.createdIds.length,
      },
      recovered,
      due,
    });
  } catch (error) {
    console.error("notification outbox cron error", error);
    return NextResponse.json(
      { error: "Unable to process notification delivery." },
      { status: 500 },
    );
  }
}
