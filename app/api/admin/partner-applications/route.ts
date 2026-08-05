import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  canTransitionPartnerApplication,
  normalizePartnerAdminNote,
  normalizePartnerApplicationStatus,
} from "@/lib/partners/partner-application";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Partner application review is not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("partnerApplications")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();
    const applications = snapshot.docs.map((document) =>
      serializeApplication(document.id, document.data()),
    );

    return NextResponse.json({
      canManage: session.role === "admin",
      applications,
      counts: {
        total: applications.length,
        new: applications.filter((application) => application.status === "new")
          .length,
        reviewing: applications.filter(
          (application) => application.status === "reviewing",
        ).length,
        needsInformation: applications.filter(
          (application) => application.status === "needs_information",
        ).length,
        approved: applications.filter(
          (application) => application.status === "approved",
        ).length,
        declined: applications.filter(
          (application) => application.status === "declined",
        ).length,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("partner application list error", error);
    return NextResponse.json(
      { error: "Unable to load partner applications." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Partner application review is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { id?: unknown; status?: unknown; adminNote?: unknown }
      | null;
    const applicationId = normalizeApplicationId(body?.id);
    const nextStatus = normalizePartnerApplicationStatus(body?.status);
    const adminNote = normalizePartnerAdminNote(body?.adminNote);
    if (!applicationId || !nextStatus) {
      return NextResponse.json(
        { error: "Choose a valid application and review status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const applicationRef = db
      .collection("partnerApplications")
      .doc(applicationId);
    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(applicationRef);
      if (!snapshot.exists) {
        throw new PartnerApplicationActionError(
          "Partner application not found.",
          404,
        );
      }

      const data = snapshot.data() ?? {};
      const currentStatus =
        normalizePartnerApplicationStatus(data.status) ?? "new";
      if (
        nextStatus !== currentStatus &&
        !canTransitionPartnerApplication(currentStatus, nextStatus)
      ) {
        throw new PartnerApplicationActionError(
          `A ${humanize(currentStatus)} application cannot move to ${humanize(
            nextStatus,
          )}.`,
          409,
        );
      }

      const now = new Date().toISOString();
      transaction.update(applicationRef, {
        status: nextStatus,
        adminNote,
        reviewedAt: now,
        reviewedByUid: session.uid,
        reviewedByEmail: session.email ?? null,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("partnerApplicationAudit").doc(), {
        action:
          nextStatus === currentStatus ? "note_updated" : "status_changed",
        applicationId,
        reference: String(data.reference ?? applicationId),
        previousStatus: currentStatus,
        nextStatus,
        adminNote,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeApplication(applicationId, {
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
      application: updated,
      merchantAccessHref: buildMerchantAccessHref(updated),
    });
  } catch (error) {
    if (error instanceof PartnerApplicationActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("partner application update error", error);
    return NextResponse.json(
      { error: "Unable to update the partner application." },
      { status: 500 },
    );
  }
}

function serializeApplication(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  const status = normalizePartnerApplicationStatus(data.status) ?? "new";
  return {
    id,
    reference: clean(data.reference, 160) || id,
    businessName: clean(data.businessName, 160) || "Unnamed business",
    contactName: clean(data.contactName, 120),
    email: clean(data.email, 220),
    phone: clean(data.phone, 80) || null,
    island: clean(data.island, 60),
    category: clean(data.category, 80),
    website: clean(data.website, 500) || null,
    existingListingId: clean(data.existingListingId, 160) || null,
    services: cleanMultiline(data.services, 1400),
    goals: cleanMultiline(data.goals, 1200) || null,
    interests: Array.isArray(data.interests)
      ? data.interests
          .map((interest: unknown) => clean(interest, 80))
          .filter(Boolean)
          .slice(0, 10)
      : [],
    referralSource: clean(data.referralSource, 120) || null,
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

function buildMerchantAccessHref(application: ReturnType<typeof serializeApplication>) {
  if (application.status !== "approved" || !application.email) return null;
  const params = new URLSearchParams({ email: application.email });
  if (application.existingListingId) {
    params.set("listingId", application.existingListingId);
  }
  return `/admin/merchants?${params.toString()}`;
}

function normalizeApplicationId(value: unknown) {
  const id = clean(value, 80);
  return /^partner_[a-f0-9]{32}$/.test(id) ? id : "";
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

class PartnerApplicationActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
