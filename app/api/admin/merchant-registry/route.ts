import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  canAdvanceMerchantStage,
  maxMerchantStage,
  merchantTodayDateKey,
  normalizeMerchantAcquisitionStage,
  normalizeMerchantFollowUpDate,
  normalizeMerchantRegistryAction,
  normalizeMerchantRegistryStatus,
  summarizeMerchantRegistry,
} from "@/lib/partners/merchant-registry";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant registry is not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("merchantRegistry")
      .orderBy("catalogUpdatedAt", "desc")
      .limit(1000)
      .get();
    const records = snapshot.docs.map((document) =>
      serializeMerchant(document.id, document.data()),
    );

    return NextResponse.json({
      canManageStage: session.role === "admin",
      records,
      summary: summarizeMerchantRegistry(records),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant registry list error", error);
    return NextResponse.json(
      { error: "Unable to load the merchant registry." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant registry is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          id?: unknown;
          action?: unknown;
          nextFollowUpDate?: unknown;
          stage?: unknown;
          status?: unknown;
          note?: unknown;
        }
      | null;
    const id = normalizeMerchantId(body?.id);
    const action = normalizeMerchantRegistryAction(body?.action);
    if (!id || !action) {
      return NextResponse.json(
        { error: "Choose a valid merchant registry action." },
        { status: 400 },
      );
    }

    if (
      (action === "advance_stage" || action === "set_status") &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only an administrator can change lifecycle stages or registry status." },
        { status: 403 },
      );
    }

    const db = getAdminDb();
    const recordRef = db.collection("merchantRegistry").doc(id);
    const now = new Date();
    const nowIso = now.toISOString();

    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(recordRef);
      if (!snapshot.exists) {
        throw new MerchantRegistryActionError("Merchant record not found.", 404);
      }

      const current = snapshot.data() ?? {};
      const patch: Record<string, unknown> = {
        updatedAt: nowIso,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      };

      if (action === "assign_to_me") {
        patch.assignedToUid = session.uid;
        patch.assignedToEmail = session.email ?? null;
        patch.assignedAt = nowIso;
      } else if (action === "unassign") {
        patch.assignedToUid = null;
        patch.assignedToEmail = null;
        patch.assignedAt = null;
      } else if (action === "schedule_follow_up") {
        const date = normalizeMerchantFollowUpDate(body?.nextFollowUpDate);
        if (!date || date < merchantTodayDateKey(now)) {
          throw new MerchantRegistryActionError(
            "Choose today or a future follow-up date.",
            400,
          );
        }
        patch.nextFollowUpDate = date;
      } else if (action === "clear_follow_up") {
        patch.nextFollowUpDate = null;
      } else if (action === "mark_contacted") {
        patch.lastContactedAt = nowIso;
        patch.lastContactedByUid = session.uid;
        patch.lastContactedByEmail = session.email ?? null;
        patch.stage = maxMerchantStage(current.stage, "contacted");
      } else if (action === "advance_stage") {
        const nextStage = normalizeMerchantAcquisitionStage(body?.stage);
        const currentStage =
          normalizeMerchantAcquisitionStage(current.stage) ?? "discovered";
        if (!nextStage || !canAdvanceMerchantStage(currentStage, nextStage)) {
          throw new MerchantRegistryActionError(
            "Merchant lifecycle stages can only move forward.",
            409,
          );
        }
        patch.stage = nextStage;
        patch.stageUpdatedAt = nowIso;
        patch.stageUpdatedByUid = session.uid;
        patch.stageUpdatedByEmail = session.email ?? null;
      } else if (action === "save_note") {
        patch.internalNote = cleanMultiline(body?.note, 2400) || null;
      } else if (action === "set_status") {
        const status = normalizeMerchantRegistryStatus(body?.status);
        if (!status) {
          throw new MerchantRegistryActionError("Choose a valid registry status.", 400);
        }
        patch.status = status;
      }

      transaction.update(recordRef, patch);
      transaction.set(db.collection("merchantRegistryAudit").doc(), {
        action,
        merchantId: id,
        canonicalKey: clean(current.canonicalKey, 220) || null,
        businessName: clean(current.businessName, 180) || null,
        previousStage:
          normalizeMerchantAcquisitionStage(current.stage) ?? "discovered",
        nextStage:
          normalizeMerchantAcquisitionStage(patch.stage) ??
          normalizeMerchantAcquisitionStage(current.stage) ??
          "discovered",
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: nowIso,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeMerchant(id, { ...current, ...patch });
    });

    return NextResponse.json({ ok: true, record: updated });
  } catch (error) {
    if (error instanceof MerchantRegistryActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant registry update error", error);
    return NextResponse.json(
      { error: "Unable to update the merchant registry." },
      { status: 500 },
    );
  }
}

function serializeMerchant(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    canonicalKey: clean(data.canonicalKey, 220) || id,
    businessName: clean(data.businessName, 180) || "Unnamed business",
    island: clean(data.island, 40),
    category: clean(data.category, 180) || "Business",
    stage: normalizeMerchantAcquisitionStage(data.stage) ?? "discovered",
    status: normalizeMerchantRegistryStatus(data.status) ?? "active",
    sourceKinds: cleanStringArray(data.sourceKinds, 80, 12),
    sourceRecordIds: cleanStringArray(data.sourceRecordIds, 180, 100),
    sourceUrls: cleanStringArray(data.sourceUrls, 600, 30),
    website: clean(data.website, 600) || null,
    phone: clean(data.phone, 80) || null,
    location: clean(data.location, 300) || null,
    assignedToUid: clean(data.assignedToUid, 180) || null,
    assignedToEmail: clean(data.assignedToEmail, 220) || null,
    nextFollowUpDate: normalizeMerchantFollowUpDate(data.nextFollowUpDate),
    lastContactedAt: data.lastContactedAt
      ? normalizeTimestampOrEpoch(data.lastContactedAt)
      : null,
    internalNote: cleanMultiline(data.internalNote, 2400) || null,
    catalogUpdatedAt: normalizeTimestampOrEpoch(
      data.catalogUpdatedAt ?? data.createdAt ?? data.updatedAt,
    ),
    createdAt: normalizeTimestampOrEpoch(
      data.createdAt ?? data.serverCreatedAt ?? data.catalogUpdatedAt,
    ),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.catalogUpdatedAt ?? data.serverUpdatedAt,
    ),
  };
}

function normalizeMerchantId(value: unknown) {
  const id = clean(value, 220);
  return /^merchant_[a-z0-9_-]+$/.test(id) ? id : "";
}

function cleanStringArray(value: unknown, maxLength: number, maxItems: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => clean(item, maxLength)).filter(Boolean)),
  ).slice(0, maxItems);
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

class MerchantRegistryActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
