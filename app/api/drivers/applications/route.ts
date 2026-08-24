import { FieldValue } from "firebase-admin/firestore";
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

    const db = getAdminDb();
    const ref = db.collection(APPLICATIONS).doc(session.uid);
    const auditRef = db.collection("driverApplicationAudit").doc();
    const notificationRef = db.collection("notifications").doc();
    const now = new Date().toISOString();

    const record = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      const existingData = existing.data() ?? {};
      if (existingData.status === "approved") {
        throw new DriverApplicationIntakeError(
          "This driver application has already been approved.",
          409,
        );
      }

      const nextRecord = {
        uid: session.uid,
        email: session.email ?? null,
        ...result.application,
        status: "pending",
        signupFeeCents: TAXI_DRIVER_SIGNUP_FEE_CENTS,
        platformCommissionBps: TAXI_PLATFORM_COMMISSION_BPS,
        driverShareBps: TAXI_DRIVER_SHARE_BPS,
        economicsDisclosure:
          "Free signup. VI Guide keeps 15% of each eligible ride; the driver share is 85% before separately disclosed processing fees or adjustments.",
        submittedAt: existingData.submittedAt ?? now,
        resubmittedAt: existing.exists ? now : null,
        updatedAt: now,
        approvedAt: null,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
        serverUpdatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { serverCreatedAt: FieldValue.serverTimestamp() }),
      };

      transaction.set(ref, nextRecord, { merge: true });
      transaction.set(auditRef, {
        action: existing.exists ? "resubmitted" : "submitted",
        applicationId: session.uid,
        applicantUid: session.uid,
        applicantEmail: session.email ?? null,
        previousStatus: existingData.status ?? null,
        nextStatus: "pending",
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      if (
        !existing.exists ||
        ["changes_requested", "rejected"].includes(String(existingData.status ?? ""))
      ) {
        transaction.set(notificationRef, {
          audience: "operations",
          kind: "driver_application",
          priority: "normal",
          title: existing.exists
            ? "Driver application resubmitted"
            : "New driver application",
          message: `${result.application.displayName} submitted a driver application for compliance review.`,
          href: "/admin/driver-applications",
          readAt: null,
          createdAt: now,
          updatedAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      return nextRecord;
    });

    return NextResponse.json({ ok: true, application: record });
  } catch (error) {
    if (error instanceof DriverApplicationIntakeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application submission error", error);
    return NextResponse.json(
      { error: "Unable to submit driver application." },
      { status: 500 },
    );
  }
}

class DriverApplicationIntakeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
