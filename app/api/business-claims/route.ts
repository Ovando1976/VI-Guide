import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizeBusinessClaim } from "@/lib/partners/business-claim";
import {
  partnerApplicationEmailDayFingerprint,
  partnerApplicationFingerprint,
  partnerApplicationQuotaAllows,
} from "@/lib/partners/partner-application-intake";
import { partnerTerritoryDayKey } from "@/lib/partners/partner-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Business claims are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { error: "Submit a valid business claim." },
      { status: 400 },
    );
  }

  const now = new Date();
  const validation = normalizeBusinessClaim(body, now);
  if (!validation.ok) {
    if (validation.spam) return acceptedWithoutDisclosure();
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const claim = validation.claim;
  const dayKey = partnerTerritoryDayKey(now);
  const fingerprint = partnerApplicationFingerprint({
    email: claim.email,
    businessName: claim.businessName,
    dayKey,
  });
  const emailDayFingerprint = partnerApplicationEmailDayFingerprint({
    email: claim.email,
    dayKey,
  });
  const claimId = `claim_${fingerprint.slice(0, 32)}`;
  const reference = `VI-CLAIM-${dayKey.replaceAll("-", "")}-${fingerprint
    .slice(0, 6)
    .toUpperCase()}`;

  try {
    const db = getAdminDb();
    const claimRef = db.collection("businessClaims").doc(claimId);
    const intakeRef = db
      .collection("businessClaimIntake")
      .doc(`email_${emailDayFingerprint.slice(0, 40)}`);

    const result = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(claimRef);
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
          reference: "VI-CLAIM-RECEIVED",
        };
      }

      transaction.set(claimRef, {
        ...claim,
        reference,
        fingerprintVersion: 1,
        status: "new",
        adminNote: null,
        reviewedAt: null,
        reviewedByUid: null,
        reviewedByEmail: null,
        createdAt: claim.submittedAt,
        updatedAt: claim.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        intakeRef,
        {
          dayKey,
          count: currentCount + 1,
          lastSubmittedAt: claim.submittedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(db.collection("businessClaimAudit").doc(), {
        action: "submitted",
        claimId,
        reference,
        businessName: claim.businessName,
        contactEmail: claim.email,
        status: "new",
        createdAt: claim.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "business_claim",
        priority: "normal",
        title: "Business listing claim",
        message: `${claim.businessName} requested control of a USVI Explorer listing.`,
        href: "/admin/business-claims",
        reference,
        readAt: null,
        createdAt: claim.submittedAt,
        updatedAt: claim.submittedAt,
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
          ? "This claim was already received today."
          : "Your business claim was received.",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("business claim submission error", error);
    return NextResponse.json(
      { error: "Unable to submit the business claim right now." },
      { status: 500 },
    );
  }
}

function acceptedWithoutDisclosure() {
  return NextResponse.json(
    {
      ok: true,
      reference: "VI-CLAIM-RECEIVED",
      message: "Your business claim was received.",
    },
    { status: 202 },
  );
}
