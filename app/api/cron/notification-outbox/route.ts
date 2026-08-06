import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { fetchOfficialViWeatherAlerts } from "@/lib/intelligence/weather-alerts";
import {
  processBookingNotificationOutboxIds,
  processDueBookingNotifications,
} from "@/lib/notifications/booking-notification-delivery";
import { reconcileRecentCommerceBookingNotifications } from "@/lib/notifications/commerce-booking-notification-recovery";
import { processProactiveTripNotifications } from "@/lib/notifications/proactive-trip-notifications";

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
    const recovered = emptyDeliverySummary();

    for (let index = 0; index < reconciliation.createdIds.length; index += 25) {
      mergeDeliverySummary(
        recovered,
        await processBookingNotificationOutboxIds(
          db,
          reconciliation.createdIds.slice(index, index + 25),
        ),
      );
    }

    const weather = await fetchOfficialViWeatherAlerts({
      timeoutMs: 5_000,
      limit: 12,
    });
    const proactive = await processProactiveTripNotifications(db, {
      weatherAlerts: weather.alerts,
      weatherStatus: weather.status,
      profileLimit: 250,
      lookaheadDays: 14,
    });
    const proactiveDelivery = emptyDeliverySummary();

    for (let index = 0; index < proactive.emailOutboxIds.length; index += 25) {
      mergeDeliverySummary(
        proactiveDelivery,
        await processBookingNotificationOutboxIds(
          db,
          proactive.emailOutboxIds.slice(index, index + 25),
        ),
      );
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
      proactive: {
        ...proactive,
        emailOutboxIds: proactive.emailOutboxIds.length,
        delivery: proactiveDelivery,
      },
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

function emptyDeliverySummary() {
  return { delivered: 0, deferred: 0, skipped: 0, failed: 0 };
}

function mergeDeliverySummary(
  target: ReturnType<typeof emptyDeliverySummary>,
  result: ReturnType<typeof emptyDeliverySummary>,
) {
  target.delivered += result.delivered;
  target.deferred += result.deferred;
  target.skipped += result.skipped;
  target.failed += result.failed;
}
