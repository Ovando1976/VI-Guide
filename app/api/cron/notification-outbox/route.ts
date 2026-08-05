import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { processDueBookingNotifications } from "@/lib/notifications/booking-notification-delivery";

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
    const result = await processDueBookingNotifications(getAdminDb(), 25);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("notification outbox cron error", error);
    return NextResponse.json(
      { error: "Unable to process notification delivery." },
      { status: 500 },
    );
  }
}
