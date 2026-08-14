import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizePartnerApplication } from "@/lib/partners/partner-application";
import { partnerTerritoryDayKey } from "@/lib/partners/partner-calendar";
import {
  partnerApplicationEmailDayFingerprint,
  partnerApplicationFingerprint,
  partnerApplicationQuotaAllows,
} from "@/lib/partners/partner-application-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Partner applications are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { error: "Submit a valid partner application." },
      { status: 400 },
    );
  }

  const now = new Date();
  const validation = normalizePartnerApplication(body, now);
  if (!validation.ok) {
    if (validation.spam) return acceptedWithoutDisclosure();
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const application = validation.application;
  const dayKey = partnerTerritoryDayKey(now);
  const fingerprint = partnerApplicationFingerprint({
    email: application.email,
    businessName: application.businessName,
    dayKey,
  });
  const emailDayFingerprint = partnerApplicationEmailDayFingerprint({
    email: application.email,
    dayKey,
  });
  const applicationId = `partner_${fingerprint.slice(0, 32)}`;
  const reference = `VI-PARTNER-${dayKey.replaceAll("-", "")}-${fingerprint
    .slice(0, 6)
    .toUpperCase()}`;

  try {
    const db = getAdminDb();
    const applicationRef = db
      .collection("partnerApplications")
      .doc(applicationId);
    const intakeRef = db
      .collection("partnerApplicationIntake")
      .doc(`email_${emailDayFingerprint.slice(0, 40)}`);
    const result = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(applicationRef);
      if (existing.exists) {
        return {
          duplicate: true,
          rateLimited: false,
          reference: String(existing.data()?.reference ?? reference),
        };
      }

      const intakeSnapshot = await transaction.get(intakeRef);
      const currentCount = Number(intakeSnapshot.data()?.count ?? 0);
      if (!partnerApplicationQuotaAllows(currentCount)) {
        return {
          duplicate: false,
          rateLimited: true,
          reference: "VI-PARTNER-RECEIVED",
        };
      }

      transaction.set(applicationRef, {
        ...application,
        reference,
        fingerprintVersion: 1,
        status: "new",
        adminNote: null,
        reviewedAt: null,
        reviewedByUid: null,
        reviewedByEmail: null,
        createdAt: application.submittedAt,
        updatedAt: application.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        intakeRef,
        {
          dayKey,
          count: currentCount + 1,
          lastSubmittedAt: application.submittedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(db.collection("partnerApplicationAudit").doc(), {
        action: "submitted",
        applicationId,
        reference,
        businessName: application.businessName,
        contactEmail: application.email,
        status: "new",
        createdAt: application.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "partner_application",
        priority: "normal",
        title: "New partner application",
        message: `${application.businessName} submitted a USVI Explorer partner application.`,
        href: "/admin/partner-applications",
        reference,
        readAt: null,
        createdAt: application.submittedAt,
        updatedAt: application.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return { duplicate: false, rateLimited: false, reference };
    });

    if (result.rateLimited) return acceptedWithoutDisclosure();

    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        reference: result.reference,
        message: result.duplicate
          ? "This application was already received today."
          : "Your partner application was received.",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("partner application submission error", error);
    return NextResponse.json(
      { error: "Unable to submit the partner application right now." },
      { status: 500 },
    );
  }
}

function acceptedWithoutDisclosure() {
  return NextResponse.json(
    {
      ok: true,
      reference: "VI-PARTNER-RECEIVED",
      message: "Your application was received.",
    },
    { status: 202 },
  );
}
