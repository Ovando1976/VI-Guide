import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { normalizeDriverApplication } from "@/lib/drivers/driver-application";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
} from "@/lib/taxi-economics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPLICATIONS = "driverApplications";

export async function GET() {
  try {
    const session = await requireSession();
    const snapshot = await getAdminDb()
      .collection(APPLICATIONS)
      .doc(session.uid)
      .get();

    return NextResponse.json({
      ok: true,
      application: snapshot.exists
        ? { id: snapshot.id, ...snapshot.data() }
        : null,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application lookup error", error);
    return NextResponse.json(
      { error: "Unable to load driver application." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "rider") {
      return NextResponse.json(
        {
          error:
            session.role === "driver"
              ? "This account is already authorized as a driver."
              : "Driver applications must be submitted from a rider account.",
        },
        { status: 409 },
      );
    }

    const result = normalizeDriverApplication(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const ref = getAdminDb().collection(APPLICATIONS).doc(session.uid);
    const existing = await ref.get();
    if (existing.data()?.status === "approved") {
      return NextResponse.json(
        { error: "This driver application has already been approved." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const record = {
      uid: session.uid,
      email: session.email ?? null,
      ...result.application,
      status: "pending",
      signupFeeCents: TAXI_DRIVER_SIGNUP_FEE_CENTS,
      platformCommissionBps: TAXI_PLATFORM_COMMISSION_BPS,
      driverShareBps: TAXI_DRIVER_SHARE_BPS,
      economicsDisclosure:
        "Free signup. VI Guide keeps 15% of each eligible ride; the driver share is 85% before separately disclosed processing fees or adjustments.",
      submittedAt: existing.data()?.submittedAt ?? now,
      resubmittedAt: existing.exists ? now : null,
      updatedAt: now,
      approvedAt: null,
      reviewedAt: null,
      reviewNote: null,
    };

    await ref.set(record, { merge: true });
    return NextResponse.json({ ok: true, application: record });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application submission error", error);
    return NextResponse.json(
      { error: "Unable to submit driver application." },
      { status: 500 },
    );
  }
}
