import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  canTransitionCruiseRequest,
  cruiseTerritoryDayKey,
  normalizeCruiseAdvisorNote,
  normalizeCruisePlanningRequest,
  normalizeCruiseRequestStatus,
} from "@/lib/cruise-advisor";
import {
  cruiseRequestEmailDayFingerprint,
  cruiseRequestFingerprint,
  cruiseRequestQuotaAllows,
} from "@/lib/cruise-advisor-intake";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Cruise planning requests are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { error: "Submit a valid cruise planning request." },
      { status: 400 },
    );
  }

  const now = new Date();
  const validation = normalizeCruisePlanningRequest(body, now);
  if (!validation.ok) {
    if (validation.spam) return acceptedWithoutDisclosure();
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const cruiseRequest = validation.request;
  const dayKey = cruiseTerritoryDayKey(now);
  const fingerprint = cruiseRequestFingerprint({
    email: cruiseRequest.email,
    departureWindowStart: cruiseRequest.departureWindowStart,
    departureWindowEnd: cruiseRequest.departureWindowEnd,
    adults: cruiseRequest.adults,
    children: cruiseRequest.children,
    dayKey,
  });
  const emailDayFingerprint = cruiseRequestEmailDayFingerprint({
    email: cruiseRequest.email,
    dayKey,
  });
  const requestId = `cruise_${fingerprint.slice(0, 32)}`;
  const reference = `VI-CRUISE-${dayKey.replaceAll("-", "")}-${fingerprint
    .slice(0, 6)
    .toUpperCase()}`;

  try {
    const db = getAdminDb();
    const requestRef = db.collection("cruisePlanningRequests").doc(requestId);
    const intakeRef = db
      .collection("cruisePlanningRequestIntake")
      .doc(`email_${emailDayFingerprint.slice(0, 40)}`);

    const result = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(requestRef);
      if (existing.exists) {
        return {
          duplicate: true,
          rateLimited: false,
          reference: String(existing.data()?.reference ?? reference),
        };
      }

      const intakeSnapshot = await transaction.get(intakeRef);
      const currentCount = Number(intakeSnapshot.data()?.count ?? 0);
      if (!cruiseRequestQuotaAllows(currentCount)) {
        return {
          duplicate: false,
          rateLimited: true,
          reference: "VI-CRUISE-RECEIVED",
        };
      }

      transaction.set(requestRef, {
        ...cruiseRequest,
        reference,
        fingerprintVersion: 1,
        status: "new",
        advisorNote: null,
        assignedAdvisorUid: null,
        assignedAdvisorEmail: null,
        quotePreparedAt: null,
        bookedAt: null,
        closedAt: null,
        createdAt: cruiseRequest.submittedAt,
        updatedAt: cruiseRequest.submittedAt,
        source: "vi-guide-cruise-planner",
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        intakeRef,
        {
          dayKey,
          count: currentCount + 1,
          lastSubmittedAt: cruiseRequest.submittedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(db.collection("cruiseAdvisorAudit").doc(), {
        action: "request_submitted",
        requestId,
        reference,
        travelerName: cruiseRequest.travelerName,
        contactEmail: cruiseRequest.email,
        status: "new",
        createdAt: cruiseRequest.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "cruise_advisor_request",
        priority: "normal",
        title: "New cruise planning request",
        message: `${cruiseRequest.travelerName} requested help planning a cruise for ${cruiseRequest.adults + cruiseRequest.children} travelers.`,
        href: "/admin/cruise-requests",
        reference,
        readAt: null,
        createdAt: cruiseRequest.submittedAt,
        updatedAt: cruiseRequest.submittedAt,
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
          ? "This cruise planning request was already received today."
          : "Your cruise planning request was received.",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("cruise planning request submission error", error);
    return NextResponse.json(
      { error: "Unable to submit the cruise planning request right now." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Cruise advisor operations are not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("cruisePlanningRequests")
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();

    return NextResponse.json({
      ok: true,
      requests: snapshot.docs.map((document) =>
        serializeRequest(document.id, document.data()),
      ),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("cruise advisor request list error", error);
    return NextResponse.json(
      { error: "Unable to load cruise planning requests." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Cruise advisor operations are not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          requestId?: unknown;
          status?: unknown;
          advisorNote?: unknown;
        }
      | null;
    const requestId = normalizeRequestId(body?.requestId);
    const nextStatus = normalizeCruiseRequestStatus(body?.status);
    const advisorNote = normalizeCruiseAdvisorNote(body?.advisorNote);

    if (!requestId || !nextStatus) {
      return NextResponse.json(
        { error: "Choose a valid cruise request and workflow status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const requestRef = db.collection("cruisePlanningRequests").doc(requestId);
    const now = new Date().toISOString();

    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(requestRef);
      if (!snapshot.exists) {
        throw new CruiseAdvisorActionError(
          "The cruise planning request was not found.",
          404,
        );
      }

      const current = snapshot.data() ?? {};
      const currentStatus = normalizeCruiseRequestStatus(current.status);
      if (!currentStatus) {
        throw new CruiseAdvisorActionError(
          "The cruise planning request has an invalid workflow status.",
          409,
        );
      }
      if (
        nextStatus !== currentStatus &&
        !canTransitionCruiseRequest(currentStatus, nextStatus)
      ) {
        throw new CruiseAdvisorActionError(
          `The request cannot move from ${currentStatus} to ${nextStatus}.`,
          409,
        );
      }

      const statusPatch =
        nextStatus === "quoted"
          ? { quotePreparedAt: now }
          : nextStatus === "booked"
            ? { bookedAt: now }
            : nextStatus === "closed"
              ? { closedAt: now }
              : {};

      transaction.update(requestRef, {
        status: nextStatus,
        advisorNote,
        assignedAdvisorUid: session.uid,
        assignedAdvisorEmail: session.email ?? null,
        ...statusPatch,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("cruiseAdvisorAudit").doc(), {
        action:
          nextStatus === currentStatus ? "advisor_note_updated" : "status_changed",
        requestId,
        reference: clean(current.reference, 120),
        previousStatus: currentStatus,
        nextStatus,
        advisorNote,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeRequest(requestId, {
        ...current,
        status: nextStatus,
        advisorNote,
        assignedAdvisorUid: session.uid,
        assignedAdvisorEmail: session.email ?? null,
        ...statusPatch,
        updatedAt: now,
      });
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof CruiseAdvisorActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("cruise advisor request update error", error);
    return NextResponse.json(
      { error: "Unable to update the cruise planning request." },
      { status: 500 },
    );
  }
}

function serializeRequest(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  return {
    id,
    reference: clean(data.reference, 120),
    travelerName: clean(data.travelerName, 140),
    email: clean(data.email, 220),
    phone: clean(data.phone, 80) || null,
    departureWindowStart: clean(data.departureWindowStart, 10),
    departureWindowEnd: clean(data.departureWindowEnd, 10),
    departurePort: clean(data.departurePort, 80),
    otherDeparturePort: clean(data.otherDeparturePort, 120) || null,
    destinations: cleanArray(data.destinations),
    adults: safeInteger(data.adults),
    children: safeInteger(data.children),
    budgetCents: safeNullableInteger(data.budgetCents),
    tripLength: clean(data.tripLength, 80),
    cabinPreference: clean(data.cabinPreference, 80),
    priorities: cleanArray(data.priorities),
    accessibilityNotes: clean(data.accessibilityNotes, 900) || null,
    celebration: clean(data.celebration, 160) || null,
    notes: clean(data.notes, 1400) || null,
    status: normalizeCruiseRequestStatus(data.status) ?? "new",
    advisorNote: clean(data.advisorNote, 2000) || null,
    assignedAdvisorUid: clean(data.assignedAdvisorUid, 160) || null,
    assignedAdvisorEmail: clean(data.assignedAdvisorEmail, 220) || null,
    createdAt: clean(data.createdAt, 50),
    updatedAt: clean(data.updatedAt, 50),
  };
}

function normalizeRequestId(value: unknown) {
  const id = clean(value, 80);
  return /^cruise_[a-f0-9]{32}$/.test(id) ? id : "";
}

function cleanArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => clean(entry, 120)).filter(Boolean).slice(0, 20)
    : [];
}

function safeInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

function safeNullableInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function acceptedWithoutDisclosure() {
  return NextResponse.json(
    {
      ok: true,
      reference: "VI-CRUISE-RECEIVED",
      message: "Your cruise planning request was received.",
    },
    { status: 202 },
  );
}

class CruiseAdvisorActionError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 409,
  ) {
    super(message);
  }
}
