import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  canTransitionTravelRequest,
  normalizeTravelAdvisorNote,
  normalizeTravelPlanningRequest,
  normalizeTravelRequestStatus,
  travelTerritoryDayKey,
} from "@/lib/travel-advisor";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Travel planning requests are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { error: "Submit a valid travel planning request." },
      { status: 400 },
    );
  }

  const now = new Date();
  const validation = normalizeTravelPlanningRequest(body, now);
  if (!validation.ok) {
    if (validation.spam) return acceptedWithoutDisclosure();
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const travelRequest = validation.request;
  const dayKey = travelTerritoryDayKey(now);
  const fingerprint = hash([
    travelRequest.email,
    travelRequest.island,
    travelRequest.arrival ?? "flexible",
    travelRequest.departure ?? "flexible",
    travelRequest.travelers,
    dayKey,
  ].join("|"));
  const emailDayFingerprint = hash(`${travelRequest.email}|${dayKey}`);
  const requestId = `travel_${fingerprint.slice(0, 32)}`;
  const reference = `VI-TRIP-${dayKey.replaceAll("-", "")}-${fingerprint
    .slice(0, 6)
    .toUpperCase()}`;

  try {
    const db = getAdminDb();
    const requestRef = db.collection("travelPlanningRequests").doc(requestId);
    const intakeRef = db
      .collection("travelPlanningRequestIntake")
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
      const currentCount = safeInteger(intakeSnapshot.data()?.count);
      if (currentCount >= 4) {
        return {
          duplicate: false,
          rateLimited: true,
          reference: "VI-TRIP-RECEIVED",
        };
      }

      transaction.set(requestRef, {
        ...travelRequest,
        reference,
        fingerprintVersion: 1,
        status: "new",
        advisorNote: null,
        assignedAdvisorUid: null,
        assignedAdvisorEmail: null,
        plannedAt: null,
        contactedAt: null,
        bookedAt: null,
        closedAt: null,
        createdAt: travelRequest.submittedAt,
        updatedAt: travelRequest.submittedAt,
        source: "vi-guide-usvi-trip-planner",
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        intakeRef,
        {
          dayKey,
          count: currentCount + 1,
          lastSubmittedAt: travelRequest.submittedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(db.collection("travelAdvisorAudit").doc(), {
        action: "request_submitted",
        requestId,
        reference,
        travelerName: travelRequest.travelerName,
        contactEmail: travelRequest.email,
        status: "new",
        createdAt: travelRequest.submittedAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "travel_advisor_request",
        priority: "normal",
        title: "New USVI trip-planning request",
        message: `${travelRequest.travelerName} requested help planning a USVI trip for ${travelRequest.travelers} traveler${travelRequest.travelers === 1 ? "" : "s"}.`,
        href: "/admin/travel-requests",
        reference,
        readAt: null,
        createdAt: travelRequest.submittedAt,
        updatedAt: travelRequest.submittedAt,
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
          ? "This USVI trip-planning request was already received today."
          : "Your USVI trip-planning request was received.",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("travel planning request submission error", error);
    return NextResponse.json(
      { error: "Unable to submit the travel planning request right now." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Travel advisor operations are not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("travelPlanningRequests")
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
    console.error("travel advisor request list error", error);
    return NextResponse.json(
      { error: "Unable to load travel planning requests." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Travel advisor operations are not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { requestId?: unknown; status?: unknown; advisorNote?: unknown }
      | null;
    const requestId = normalizeRequestId(body?.requestId);
    const nextStatus = normalizeTravelRequestStatus(body?.status);
    const advisorNote = normalizeTravelAdvisorNote(body?.advisorNote);

    if (!requestId || !nextStatus) {
      return NextResponse.json(
        { error: "Choose a valid travel request and workflow status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const requestRef = db.collection("travelPlanningRequests").doc(requestId);
    const now = new Date().toISOString();

    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(requestRef);
      if (!snapshot.exists) {
        throw new TravelAdvisorActionError(
          "The travel planning request was not found.",
          404,
        );
      }

      const current = snapshot.data() ?? {};
      const currentStatus = normalizeTravelRequestStatus(current.status);
      if (!currentStatus) {
        throw new TravelAdvisorActionError(
          "The travel planning request has an invalid workflow status.",
          409,
        );
      }
      if (!canTransitionTravelRequest(currentStatus, nextStatus)) {
        throw new TravelAdvisorActionError(
          `The request cannot move from ${currentStatus} to ${nextStatus}.`,
          409,
        );
      }

      const statusPatch =
        nextStatus === "planned"
          ? { plannedAt: now }
          : nextStatus === "contacted"
            ? { contactedAt: now }
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

      transaction.set(db.collection("travelAdvisorAudit").doc(), {
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
    if (error instanceof TravelAdvisorActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("travel advisor request update error", error);
    return NextResponse.json(
      { error: "Unable to update the travel planning request." },
      { status: 500 },
    );
  }
}

function serializeRequest(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    reference: clean(data.reference, 120),
    travelerName: clean(data.travelerName, 140),
    email: clean(data.email, 220),
    phone: clean(data.phone, 80) || null,
    island: clean(data.island, 40),
    arrival: clean(data.arrival, 10) || null,
    departure: clean(data.departure, 10) || null,
    travelers: safeInteger(data.travelers),
    budget: clean(data.budget, 60),
    stayStatus: clean(data.stayStatus, 80),
    pace: clean(data.pace, 40),
    interests: cleanArray(data.interests),
    notes: clean(data.notes, 1800) || null,
    status: normalizeTravelRequestStatus(data.status) ?? "new",
    advisorNote: clean(data.advisorNote, 2000) || null,
    assignedAdvisorUid: clean(data.assignedAdvisorUid, 160) || null,
    assignedAdvisorEmail: clean(data.assignedAdvisorEmail, 220) || null,
    createdAt: clean(data.createdAt, 50),
    updatedAt: clean(data.updatedAt, 50),
  };
}

function normalizeRequestId(value: unknown) {
  const id = clean(value, 80);
  return /^travel_[a-f0-9]{32}$/.test(id) ? id : "";
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

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function acceptedWithoutDisclosure() {
  return NextResponse.json(
    {
      ok: true,
      reference: "VI-TRIP-RECEIVED",
      message: "Your USVI trip-planning request was received.",
    },
    { status: 202 },
  );
}

class TravelAdvisorActionError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 409,
  ) {
    super(message);
  }
}
