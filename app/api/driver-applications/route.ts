import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  authErrorResponse,
  requireSession,
} from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
} from "@/lib/taxi-economics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRIVER_APPLICATIONS = "driverApplications";
const ISLANDS = new Set(["st_thomas", "st_john", "st_croix"]);
const STATUSES = new Set(["submitted", "under_review", "approved", "rejected"]);

type DriverApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export async function GET() {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Driver applications are not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection(DRIVER_APPLICATIONS)
      .doc(session.uid)
      .get();

    return NextResponse.json({
      application: snapshot.exists ? publicApplication(snapshot.data() ?? {}) : null,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application status error", error);
    return NextResponse.json(
      { error: "Unable to load your driver application right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Driver applications are not configured on the server." },
        { status: 503 },
      );
    }

    if (session.role === "driver") {
      return NextResponse.json(
        { error: "This account already has driver access." },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body) {
      return NextResponse.json(
        { error: "Submit a valid driver application." },
        { status: 400 },
      );
    }

    const fullName = text(body.fullName, 120);
    const phone = text(body.phone, 40);
    const island = text(body.island, 30);
    const credentialNumber = text(body.credentialNumber, 80);
    const vehicleSummary = text(body.vehicleSummary, 160);
    const association = text(body.association, 120);

    if (
      fullName.length < 2 ||
      phone.length < 7 ||
      !ISLANDS.has(island) ||
      credentialNumber.length < 2 ||
      vehicleSummary.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Add your name, phone, island, taxi/for-hire credential number, and vehicle details.",
        },
        { status: 400 },
      );
    }

    if (body.acceptedEconomics !== true || body.acceptedCompliance !== true) {
      return NextResponse.json(
        {
          error:
            "Accept the driver economics and compliance review terms before submitting.",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const db = getAdminDb();
    const applicationRef = db.collection(DRIVER_APPLICATIONS).doc(session.uid);
    const result = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(applicationRef);
      const existingData = existing.data() ?? {};
      const existingStatus = status(existingData.status);

      if (existing.exists && existingStatus === "approved") {
        return { status: existingStatus, created: false, approved: true };
      }

      const nextStatus: DriverApplicationStatus =
        existingStatus === "under_review" ? "under_review" : "submitted";
      const submittedAt =
        existing.exists && typeof existingData.submittedAt === "string"
          ? existingData.submittedAt
          : now;

      transaction.set(
        applicationRef,
        {
          uid: session.uid,
          accountEmail: session.email ?? null,
          accountName: session.name ?? null,
          fullName,
          phone,
          island,
          credentialNumber,
          vehicleSummary,
          association: association || null,
          status: nextStatus,
          signupFeeCents: TAXI_DRIVER_SIGNUP_FEE_CENTS,
          platformCommissionBps: TAXI_PLATFORM_COMMISSION_BPS,
          driverShareBps: TAXI_DRIVER_SHARE_BPS,
          economicsAcceptedAt: now,
          complianceDeclarationAcceptedAt: now,
          submittedAt,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
          ...(!existing.exists
            ? { serverCreatedAt: FieldValue.serverTimestamp() }
            : {}),
        },
        { merge: true },
      );

      transaction.set(db.collection("driverApplicationAudit").doc(), {
        action: existing.exists ? "updated" : "submitted",
        applicantUid: session.uid,
        applicantEmail: session.email ?? null,
        status: nextStatus,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "driver_application",
        priority: "normal",
        title: existing.exists
          ? "Driver application updated"
          : "New driver application",
        message: `${fullName} submitted driver credentials for review.`,
        href: "/admin/taxi-operations",
        applicantUid: session.uid,
        readAt: null,
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: nextStatus,
        created: !existing.exists,
        approved: false,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        status: result.status,
        message: result.approved
          ? "Your driver application is already approved. Driver access is activated separately after trusted provisioning."
          : result.created
            ? "Your driver application was received for compliance review."
            : "Your driver application was updated.",
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application submission error", error);
    return NextResponse.json(
      { error: "Unable to submit your driver application right now." },
      { status: 500 },
    );
  }
}

function publicApplication(data: Record<string, unknown>) {
  return {
    status: status(data.status),
    fullName: text(data.fullName, 120),
    phone: text(data.phone, 40),
    island: text(data.island, 30),
    credentialNumber: text(data.credentialNumber, 80),
    vehicleSummary: text(data.vehicleSummary, 160),
    association: text(data.association, 120),
    submittedAt: text(data.submittedAt, 80),
    updatedAt: text(data.updatedAt, 80),
    signupFeeCents: TAXI_DRIVER_SIGNUP_FEE_CENTS,
    platformCommissionBps: TAXI_PLATFORM_COMMISSION_BPS,
    driverShareBps: TAXI_DRIVER_SHARE_BPS,
  };
}

function status(value: unknown): DriverApplicationStatus {
  const normalized = typeof value === "string" ? value : "submitted";
  return STATUSES.has(normalized)
    ? (normalized as DriverApplicationStatus)
    : "submitted";
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
