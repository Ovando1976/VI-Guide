import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizePartnerApplicationStatus } from "@/lib/partners/partner-application";
import {
  normalizePartnerPipelineAction,
  partnerFollowUpState,
  partnerLeadCanBeClaimed,
  partnerPipelinePatch,
  summarizePartnerPipeline,
} from "@/lib/partners/partner-pipeline";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Partner pipeline operations are not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("partnerApplications")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();
    const now = new Date();
    const leads = snapshot.docs.map((document) =>
      serializeLead(document.id, document.data(), now),
    );

    return NextResponse.json({
      canManage: session.role === "admin",
      currentUserEmail: session.email ?? null,
      summary: summarizePartnerPipeline(leads, now),
      leads,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("partner pipeline list error", error);
    return NextResponse.json(
      { error: "Unable to load the partner acquisition pipeline." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Partner pipeline operations are not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          id?: unknown;
          action?: unknown;
          nextFollowUpDate?: unknown;
        }
      | null;
    const applicationId = normalizeApplicationId(body?.id);
    const action = normalizePartnerPipelineAction(body?.action);
    if (!applicationId || !action) {
      return NextResponse.json(
        { error: "Choose a valid partner lead and pipeline action." },
        { status: 400 },
      );
    }

    const now = new Date();
    const patch = partnerPipelinePatch({
      action,
      sessionUid: session.uid,
      sessionEmail: session.email,
      nextFollowUpDate: body?.nextFollowUpDate,
      now,
    });
    if (!patch) {
      return NextResponse.json(
        {
          error:
            action === "schedule_follow_up"
              ? "Choose today or a future USVI follow-up date."
              : "The pipeline action could not be prepared.",
        },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const applicationRef = db
      .collection("partnerApplications")
      .doc(applicationId);
    const lead = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(applicationRef);
      if (!snapshot.exists) {
        throw new PartnerPipelineActionError("Partner application not found.", 404);
      }

      const data = snapshot.data() ?? {};
      const status = normalizePartnerApplicationStatus(data.status) ?? "new";
      if (status === "approved" || status === "declined") {
        throw new PartnerPipelineActionError(
          "Closed applications cannot be changed through the active acquisition pipeline.",
          409,
        );
      }

      const currentOwnerUid = clean(data.assignedToUid, 160);
      if (
        action === "assign_to_me" &&
        !partnerLeadCanBeClaimed(currentOwnerUid, session.uid)
      ) {
        throw new PartnerPipelineActionError(
          "This lead is already assigned. Unassign it explicitly before changing ownership.",
          409,
        );
      }

      transaction.update(applicationRef, {
        ...patch,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("partnerApplicationAudit").doc(), {
        action: `pipeline_${action}`,
        applicationId,
        reference: clean(data.reference, 160) || applicationId,
        previousAssignedToUid: currentOwnerUid || null,
        previousAssignedToEmail: clean(data.assignedToEmail, 220) || null,
        previousNextFollowUpDate:
          clean(data.nextFollowUpDate, 20) || null,
        nextAssignedToUid:
          "assignedToUid" in patch
            ? patch.assignedToUid
            : currentOwnerUid || null,
        nextAssignedToEmail:
          "assignedToEmail" in patch
            ? patch.assignedToEmail
            : clean(data.assignedToEmail, 220) || null,
        nextFollowUpDate:
          "nextFollowUpDate" in patch
            ? patch.nextFollowUpDate
            : clean(data.nextFollowUpDate, 20) || null,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: now.toISOString(),
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeLead(
        applicationId,
        {
          ...data,
          ...patch,
        },
        now,
      );
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof PartnerPipelineActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("partner pipeline update error", error);
    return NextResponse.json(
      { error: "Unable to update the partner acquisition pipeline." },
      { status: 500 },
    );
  }
}

function serializeLead(
  id: string,
  data: FirebaseFirestore.DocumentData,
  now: Date,
) {
  const status = normalizePartnerApplicationStatus(data.status) ?? "new";
  const nextFollowUpDate = clean(data.nextFollowUpDate, 20) || null;
  const assignedToEmail = clean(data.assignedToEmail, 220) || null;

  return {
    id,
    reference: clean(data.reference, 160) || id,
    businessName: clean(data.businessName, 160) || "Unnamed business",
    contactName: clean(data.contactName, 120),
    email: clean(data.email, 220),
    phone: clean(data.phone, 80) || null,
    island: clean(data.island, 60),
    category: clean(data.category, 80),
    status,
    assignedToUid: clean(data.assignedToUid, 160) || null,
    assignedToEmail,
    assignedAt: nullableTimestamp(data.assignedAt),
    nextFollowUpDate,
    lastContactedAt: nullableTimestamp(data.lastContactedAt),
    lastContactedByEmail: clean(data.lastContactedByEmail, 220) || null,
    followUpState: partnerFollowUpState(
      { status, assignedToEmail, nextFollowUpDate },
      now,
    ),
    submittedAt: normalizeTimestampOrEpoch(
      data.submittedAt ?? data.createdAt ?? data.serverCreatedAt,
    ),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.createdAt ?? data.serverUpdatedAt,
    ),
  };
}

function nullableTimestamp(value: unknown) {
  return value ? normalizeTimestampOrEpoch(value) : null;
}

function normalizeApplicationId(value: unknown) {
  const id = clean(value, 80);
  return /^partner_[a-f0-9]{32}$/.test(id) ? id : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

class PartnerPipelineActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
