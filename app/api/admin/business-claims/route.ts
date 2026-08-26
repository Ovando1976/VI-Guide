import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  canTransitionBusinessClaim,
  normalizeBusinessClaimAdminNote,
  normalizeBusinessClaimStatus,
} from "@/lib/partners/business-claim";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Business claim review is not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("businessClaims")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();
    const claims = snapshot.docs.map((document) =>
      serializeClaim(document.id, document.data()),
    );

    return NextResponse.json({
      canManage: session.role === "admin",
      claims,
      counts: {
        total: claims.length,
        new: claims.filter((claim) => claim.status === "new").length,
        reviewing: claims.filter((claim) => claim.status === "reviewing").length,
        needsInformation: claims.filter(
          (claim) => claim.status === "needs_information",
        ).length,
        approved: claims.filter((claim) => claim.status === "approved").length,
        declined: claims.filter((claim) => claim.status === "declined").length,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("business claim list error", error);
    return NextResponse.json(
      { error: "Unable to load business claims." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Business claim review is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { id?: unknown; status?: unknown; adminNote?: unknown }
      | null;
    const claimId = normalizeClaimId(body?.id);
    const nextStatus = normalizeBusinessClaimStatus(body?.status);
    const adminNote = normalizeBusinessClaimAdminNote(body?.adminNote);
    if (!claimId || !nextStatus) {
      return NextResponse.json(
        { error: "Choose a valid claim and review status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const claimRef = db.collection("businessClaims").doc(claimId);
    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(claimRef);
      if (!snapshot.exists) {
        throw new BusinessClaimActionError("Business claim not found.", 404);
      }

      const data = snapshot.data() ?? {};
      const currentStatus = normalizeBusinessClaimStatus(data.status) ?? "new";
      if (
        nextStatus !== currentStatus &&
        !canTransitionBusinessClaim(currentStatus, nextStatus)
      ) {
        throw new BusinessClaimActionError(
          `A ${humanize(currentStatus)} claim cannot move to ${humanize(nextStatus)}.`,
          409,
        );
      }

      const now = new Date().toISOString();
      transaction.update(claimRef, {
        status: nextStatus,
        adminNote,
        reviewedAt: now,
        reviewedByUid: session.uid,
        reviewedByEmail: session.email ?? null,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("businessClaimAudit").doc(), {
        action: nextStatus === currentStatus ? "note_updated" : "status_changed",
        claimId,
        reference: String(data.reference ?? claimId),
        previousStatus: currentStatus,
        nextStatus,
        adminNote,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeClaim(claimId, {
        ...data,
        status: nextStatus,
        adminNote,
        reviewedAt: now,
        reviewedByUid: session.uid,
        reviewedByEmail: session.email ?? null,
        updatedAt: now,
      });
    });

    return NextResponse.json({
      ok: true,
      claim: updated,
      merchantAccessHref: buildMerchantAccessHref(updated),
    });
  } catch (error) {
    if (error instanceof BusinessClaimActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("business claim update error", error);
    return NextResponse.json(
      { error: "Unable to update the business claim." },
      { status: 500 },
    );
  }
}

function serializeClaim(id: string, data: FirebaseFirestore.DocumentData) {
  const status = normalizeBusinessClaimStatus(data.status) ?? "new";
  return {
    id,
    reference: clean(data.reference, 160) || id,
    businessName: clean(data.businessName, 160) || "Unnamed business",
    existingListingId: clean(data.existingListingId, 160) || null,
    contactName: clean(data.contactName, 120),
    email: clean(data.email, 220),
    phone: clean(data.phone, 80) || null,
    island: clean(data.island, 60),
    claimRole: clean(data.claimRole, 80),
    website: clean(data.website, 500) || null,
    verificationNote: cleanMultiline(data.verificationNote, 800) || null,
    status,
    adminNote: cleanMultiline(data.adminNote, 1600) || null,
    reviewedAt: data.reviewedAt
      ? normalizeTimestampOrEpoch(data.reviewedAt)
      : null,
    reviewedByEmail: clean(data.reviewedByEmail, 220) || null,
    submittedAt: normalizeTimestampOrEpoch(
      data.submittedAt ?? data.createdAt ?? data.serverCreatedAt,
    ),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.createdAt ?? data.serverUpdatedAt,
    ),
  };
}

function buildMerchantAccessHref(claim: ReturnType<typeof serializeClaim>) {
  if (claim.status !== "approved" || !claim.email || !claim.existingListingId) {
    return null;
  }
  const params = new URLSearchParams({
    email: claim.email,
    listingId: claim.existingListingId,
  });
  return `/admin/merchants?${params.toString()}`;
}

function normalizeClaimId(value: unknown) {
  const id = clean(value, 80);
  return /^claim_[a-f0-9]{32}$/.test(id) ? id : "";
}

function cleanMultiline(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxLength)
    : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

class BusinessClaimActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
