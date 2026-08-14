import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizePartnerApplicationStatus } from "@/lib/partners/partner-application";
import {
  normalizePartnerApplicationReference,
  normalizePartnerStatusEmail,
  publicPartnerApplicationStatus,
} from "@/lib/partners/partner-application-status";
import {
  partnerStatusLookupDayFingerprint,
  partnerStatusLookupQuotaAllows,
} from "@/lib/partners/partner-application-status-intake";
import { partnerTerritoryDayKey } from "@/lib/partners/partner-calendar";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Partner application status is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { reference?: unknown; email?: unknown }
    | null;
  const reference = normalizePartnerApplicationReference(body?.reference);
  const email = normalizePartnerStatusEmail(body?.email);
  if (!reference || !email) {
    return NextResponse.json(
      { error: "Enter the application reference and contact email." },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const now = new Date();
    const dayKey = partnerTerritoryDayKey(now);
    const lookupFingerprint = partnerStatusLookupDayFingerprint({
      email,
      dayKey,
    });
    const intakeRef = db
      .collection("partnerApplicationStatusIntake")
      .doc(`lookup_${lookupFingerprint.slice(0, 40)}`);
    const allowed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(intakeRef);
      const currentCount = Number(snapshot.data()?.count ?? 0);
      if (!partnerStatusLookupQuotaAllows(currentCount)) return false;

      transaction.set(
        intakeRef,
        {
          dayKey,
          count: currentCount + 1,
          lastLookupAt: now.toISOString(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    });
    if (!allowed) return throttled();

    const snapshot = await db
      .collection("partnerApplications")
      .where("reference", "==", reference)
      .limit(2)
      .get();
    if (snapshot.size !== 1) return notFound();

    const document = snapshot.docs[0];
    const data = document?.data() ?? {};
    if (normalizePartnerStatusEmail(data.email) !== email) return notFound();

    const status = normalizePartnerApplicationStatus(data.status) ?? "new";
    const publicStatus = publicPartnerApplicationStatus(status);

    return NextResponse.json(
      {
        ok: true,
        application: {
          reference,
          businessName:
            clean(data.businessName, 160) || "USVI Explorer partner application",
          ...publicStatus,
          submittedAt: normalizeTimestampOrEpoch(
            data.submittedAt ?? data.createdAt ?? data.serverCreatedAt,
          ),
          updatedAt: normalizeTimestampOrEpoch(
            data.updatedAt ?? data.createdAt ?? data.serverUpdatedAt,
          ),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("partner application status error", error);
    return NextResponse.json(
      { error: "Unable to load the application status right now." },
      { status: 500 },
    );
  }
}

function notFound() {
  return NextResponse.json(
    {
      error:
        "No application matched that reference and contact email combination.",
    },
    {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}

function throttled() {
  return NextResponse.json(
    {
      error:
        "Unable to verify this application right now. Try again later or contact the USVI Explorer team.",
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Retry-After": "3600",
      },
    },
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
