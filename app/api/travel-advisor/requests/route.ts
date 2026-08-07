import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { processBookingNotificationOutboxIds } from "@/lib/notifications/booking-notification-delivery";
import { normalizeBookingNotification } from "@/lib/notifications/booking-notification-outbox";
import {
  canTransitionTravelRequest,
  normalizeTravelAdvisorNote,
  normalizeTravelPlanningRequest,
  normalizeTravelRequestStatus,
  travelTerritoryDayKey,
  type TravelRequestStatus,
} from "@/lib/travel-advisor";

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
          notificationOutboxIds: [] as string[],
        };
      }

      const intakeSnapshot = await transaction.get(intakeRef);
      const currentCount = safeInteger(intakeSnapshot.data()?.count);
      if (currentCount >= 4) {
        return {
          duplicate: false,
          rateLimited: true,
          reference: "VI-TRIP-RECEIVED",
          notificationOutboxIds: [] as string[],
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
        followupCount: 0,
        followupQueuedAt: null,
        followupSubject: null,
        followupMessage: null,
        createdAt: travelRequest.submittedAt,
        updatedAt: travelRequest.submittedAt,
        source: "vi-guide-usvi-trip-planner",
        acknowledgementQueuedAt: travelRequest.submittedAt,
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

      const acknowledgement = normalizeBookingNotification({
        bookingId: requestId,
        reference,
        event: "travel_advisor_requested",
        audience: "traveler",
        listingId: "travel-advisor",
        listingName: "VI Guide USVI Travel Advisor",
        recipientEmail: travelRequest.email,
        title: "Your VI Guide trip-planning request is in",
        message: `We received your USVI trip-planning request ${reference}. A VI Guide travel advisor can review the trip details you submitted while you continue building and saving ideas in My Trip. No reservation or price is confirmed until VI Guide or the relevant provider confirms it with you.`,
        href: "/planner",
        createdAt: travelRequest.submittedAt,
      });
      if (!acknowledgement) {
        throw new Error("Unable to prepare the travel advisor acknowledgement.");
      }

      transaction.set(
        db.collection("notificationOutbox").doc(acknowledgement.id),
        {
          ...acknowledgement,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
      );

      return {
        duplicate: false,
        rateLimited: false,
        reference,
        notificationOutboxIds: [acknowledgement.id],
      };
    });

    if (result.rateLimited) return acceptedWithoutDisclosure();

    if (result.notificationOutboxIds.length > 0) {
      try {
        await processBookingNotificationOutboxIds(
          db,
          result.notificationOutboxIds,
        );
      } catch (error) {
        console.error("travel advisor acknowledgement delivery attempt failed", error);
      }
    }

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
      | {
          requestId?: unknown;
          status?: unknown;
          advisorNote?: unknown;
          sendFollowup?: unknown;
          followupSubject?: unknown;
          followupMessage?: unknown;
        }
      | null;
    const requestId = normalizeRequestId(body?.requestId);
    const requestedStatus = normalizeTravelRequestStatus(body?.status);
    const advisorNote = normalizeTravelAdvisorNote(body?.advisorNote);
    const sendFollowup = body?.sendFollowup === true;
    const followupSubject = clean(body?.followupSubject, 180);
    const followupMessage = clean(body?.followupMessage, 1200);

    if (!requestId || !requestedStatus) {
      return NextResponse.json(
        { error: "Choose a valid travel request and workflow status." },
        { status: 400 },
      );
    }
    if (sendFollowup && (!followupSubject || !followupMessage)) {
      return NextResponse.json(
        { error: "Add a subject and traveler message before sending the follow-up." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const requestRef = db.collection("travelPlanningRequests").doc(requestId);
    const nowDate = new Date();
    const now = nowDate.toISOString();

    const result = await db.runTransaction(async (transaction) => {
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
      if (sendFollowup && (currentStatus === "booked" || currentStatus === "closed")) {
        throw new TravelAdvisorActionError(
          "Traveler follow-up from the lead desk is only available before the request is booked or closed.",
          409,
        );
      }

      const nextStatus: TravelRequestStatus = sendFollowup
        ? "contacted"
        : requestedStatus;
      if (!canTransitionTravelRequest(currentStatus, nextStatus)) {
        throw new TravelAdvisorActionError(
          `The request cannot move from ${currentStatus} to ${nextStatus}.`,
          409,
        );
      }

      const reference = clean(current.reference, 120) || requestId;
      const email = clean(current.email, 220).toLowerCase();
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

      let followupQueued = false;
      let followupDuplicate = false;
      const notificationOutboxIds: string[] = [];
      let followupPatch: Record<string, unknown> = {};

      if (sendFollowup) {
        const dedupeKey = hash(
          [
            requestId,
            followupSubject.toLowerCase(),
            followupMessage.toLowerCase(),
            travelTerritoryDayKey(nowDate),
          ].join("|"),
        ).slice(0, 32);
        const followup = normalizeBookingNotification({
          bookingId: requestId,
          reference,
          event: "travel_advisor_followup",
          audience: "traveler",
          listingId: "travel-advisor",
          listingName: "VI Guide USVI Travel Advisor",
          recipientEmail: email,
          title: followupSubject,
          message: followupMessage,
          href: "/planner",
          actor: session,
          dedupeKey,
          createdAt: now,
        });
        if (!followup) {
          throw new TravelAdvisorActionError(
            "Unable to prepare the traveler follow-up.",
            409,
          );
        }

        const followupRef = db.collection("notificationOutbox").doc(followup.id);
        const existingFollowup = await transaction.get(followupRef);
        followupDuplicate = existingFollowup.exists;

        if (!existingFollowup.exists) {
          followupQueued = true;
          notificationOutboxIds.push(followup.id);
          followupPatch = {
            followupCount: safeInteger(current.followupCount) + 1,
            followupQueuedAt: now,
            followupSubject,
            followupMessage,
          };

          transaction.set(followupRef, {
            ...followup,
            serverCreatedAt: FieldValue.serverTimestamp(),
            serverUpdatedAt: FieldValue.serverTimestamp(),
          });

          transaction.set(db.collection("notifications").doc(), {
            audience: "traveler",
            kind: "travel_advisor_followup",
            priority: "normal",
            title: followupSubject,
            message: followupMessage,
            href: "/planner",
            reference,
            readAt: null,
            createdAt: now,
            updatedAt: now,
            serverCreatedAt: FieldValue.serverTimestamp(),
          });

          transaction.set(db.collection("travelAdvisorAudit").doc(), {
            action: "traveler_followup_queued",
            requestId,
            reference,
            subject: followupSubject,
            messageLength: followupMessage.length,
            actorUid: session.uid,
            actorEmail: session.email ?? null,
            createdAt: now,
            serverCreatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      transaction.update(requestRef, {
        status: nextStatus,
        advisorNote,
        assignedAdvisorUid: session.uid,
        assignedAdvisorEmail: session.email ?? null,
        ...statusPatch,
        ...followupPatch,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(db.collection("travelAdvisorAudit").doc(), {
        action:
          nextStatus === currentStatus ? "advisor_note_updated" : "status_changed",
        requestId,
        reference,
        previousStatus: currentStatus,
        nextStatus,
        advisorNote,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return {
        request: serializeRequest(requestId, {
          ...current,
          status: nextStatus,
          advisorNote,
          assignedAdvisorUid: session.uid,
          assignedAdvisorEmail: session.email ?? null,
          ...statusPatch,
          ...followupPatch,
          updatedAt: now,
        }),
        followupQueued,
        followupDuplicate,
        notificationOutboxIds,
      };
    });

    if (result.notificationOutboxIds.length > 0) {
      try {
        await processBookingNotificationOutboxIds(
          db,
          result.notificationOutboxIds,
        );
      } catch (error) {
        console.error("travel advisor follow-up delivery attempt failed", error);
      }
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      followupQueued: result.followupQueued,
      followupDuplicate: result.followupDuplicate,
    });
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
    followupCount: safeInteger(data.followupCount),
    followupQueuedAt: clean(data.followupQueuedAt, 50) || null,
    followupSubject: clean(data.followupSubject, 180) || null,
    followupMessage: clean(data.followupMessage, 1200) || null,
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
