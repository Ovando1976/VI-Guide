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
  normalizeTravelRequestStatus,
} from "@/lib/travel-advisor";
import { buildTravelAdvisorProposalSnapshot } from "@/lib/travel-advisor-proposal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Travel advisor proposals are not configured." },
        { status: 503 },
      );
    }

    const requestId = normalizeRequestId(params.requestId);
    if (!requestId) {
      return NextResponse.json(
        { error: "Choose a valid travel planning request." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          plan?: unknown;
          sendToTraveler?: unknown;
          subject?: unknown;
          message?: unknown;
        }
      | null;
    const proposal = buildTravelAdvisorProposalSnapshot({
      requestId,
      plan: body?.plan,
    });
    if (!proposal) {
      return NextResponse.json(
        {
          error:
            "Choose a saved VI Guide journey with at least one stop before publishing a proposal.",
        },
        { status: 400 },
      );
    }

    const sendToTraveler = body?.sendToTraveler === true;
    const subject = clean(body?.subject, 180);
    const message = clean(body?.message, 1200);
    if (sendToTraveler && (!subject || !message)) {
      return NextResponse.json(
        { error: "Review the proposal email subject and message before sending." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const requestRef = db.collection("travelPlanningRequests").doc(requestId);
    const shareRef = db.collection("sharedJourneys").doc(proposal.shareId);
    const now = new Date().toISOString();
    const proposalHref = `/shared-trip/${proposal.shareId}`;

    const result = await db.runTransaction(async (transaction) => {
      const [requestSnapshot, shareSnapshot] = await Promise.all([
        transaction.get(requestRef),
        transaction.get(shareRef),
      ]);
      if (!requestSnapshot.exists) {
        throw new ProposalActionError("The travel planning request was not found.", 404);
      }

      const current = requestSnapshot.data() ?? {};
      const currentStatus = normalizeTravelRequestStatus(current.status);
      if (!currentStatus) {
        throw new ProposalActionError(
          "The travel planning request has an invalid workflow status.",
          409,
        );
      }
      if (currentStatus === "booked" || currentStatus === "closed") {
        throw new ProposalActionError(
          "Publish proposals before the lead moves into the booked or closed workflow.",
          409,
        );
      }

      const requestedIsland = clean(current.island, 40);
      if (
        (requestedIsland === "stt" ||
          requestedIsland === "stj" ||
          requestedIsland === "stx") &&
        proposal.plan.island !== requestedIsland
      ) {
        throw new ProposalActionError(
          "The selected journey is for a different island than this travel request.",
          409,
        );
      }

      if (
        shareSnapshot.exists &&
        clean(shareSnapshot.data()?.travelRequestId, 80) !== requestId
      ) {
        throw new ProposalActionError(
          "The proposal share identifier is already in use.",
          409,
        );
      }

      const reference = clean(current.reference, 120) || requestId;
      const currentShareId = clean(current.proposalShareId, 40);
      const currentVersion = Math.max(0, safeInteger(current.proposalVersion));
      const duplicateProposal =
        currentShareId === proposal.shareId && shareSnapshot.exists;
      const version = duplicateProposal
        ? Math.max(1, currentVersion)
        : currentVersion + 1;

      let nextStatus = currentStatus;
      let proposalOutbox: ReturnType<typeof normalizeBookingNotification> = null;
      let proposalSendDuplicate = false;
      let proposalOutboxRef: FirebaseFirestore.DocumentReference | null = null;

      if (sendToTraveler) {
        if (!canTransitionTravelRequest(currentStatus, "contacted")) {
          throw new ProposalActionError(
            `The request cannot move from ${currentStatus} to contacted.`,
            409,
          );
        }
        nextStatus = "contacted";
        proposalOutbox = normalizeBookingNotification({
          bookingId: requestId,
          reference,
          event: "travel_advisor_proposal",
          audience: "traveler",
          listingId: "travel-advisor",
          listingName: "VI Guide USVI Travel Advisor",
          recipientEmail: clean(current.email, 220),
          title: subject,
          message,
          href: proposalHref,
          actor: session,
          dedupeKey: proposal.shareId,
          createdAt: now,
        });
        if (!proposalOutbox) {
          throw new ProposalActionError(
            "Unable to prepare the proposal delivery message.",
            409,
          );
        }
        proposalOutboxRef = db
          .collection("notificationOutbox")
          .doc(proposalOutbox.id);
        const existingOutbox = await transaction.get(proposalOutboxRef);
        proposalSendDuplicate = existingOutbox.exists;
      }

      if (!shareSnapshot.exists) {
        transaction.set(shareRef, {
          ownerId: session.uid,
          plan: proposal.plan,
          source: "travel_advisor_proposal",
          travelRequestId: requestId,
          proposalReference: reference,
          proposalVersion: version,
          proposalDigest: proposal.digest,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (!duplicateProposal) {
        transaction.set(
          shareRef,
          {
            ownerId: session.uid,
            proposalVersion: version,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (!duplicateProposal) {
        transaction.set(db.collection("travelAdvisorAudit").doc(), {
          action: "proposal_published",
          requestId,
          reference,
          proposalShareId: proposal.shareId,
          proposalVersion: version,
          proposalPlanId: proposal.plan.id,
          proposalStopCount: proposal.plan.plan.length,
          actorUid: session.uid,
          actorEmail: session.email ?? null,
          createdAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      const proposalSent = Boolean(
        sendToTraveler &&
          proposalOutbox &&
          proposalOutboxRef &&
          !proposalSendDuplicate,
      );
      const notificationOutboxIds: string[] = [];
      if (proposalSent && proposalOutbox && proposalOutboxRef) {
        notificationOutboxIds.push(proposalOutbox.id);
        transaction.set(proposalOutboxRef, {
          ...proposalOutbox,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(db.collection("notifications").doc(), {
          audience: "traveler",
          kind: "travel_advisor_proposal",
          priority: "normal",
          title: subject,
          message,
          href: proposalHref,
          reference,
          readAt: null,
          createdAt: now,
          updatedAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(db.collection("travelAdvisorAudit").doc(), {
          action: "proposal_sent",
          requestId,
          reference,
          proposalShareId: proposal.shareId,
          proposalVersion: version,
          subject,
          messageLength: message.length,
          actorUid: session.uid,
          actorEmail: session.email ?? null,
          createdAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      const publishedAt = duplicateProposal
        ? clean(current.proposalPublishedAt, 50) || now
        : now;
      const previousSentAt = clean(current.proposalSentAt, 50) || null;
      const sentAt = proposalSent
        ? now
        : duplicateProposal
          ? previousSentAt
          : null;
      const requestPatch: Record<string, unknown> = {
        proposalShareId: proposal.shareId,
        proposalHref,
        proposalVersion: version,
        proposalPlanId: proposal.plan.id,
        proposalTitle: proposal.plan.title,
        proposalPublishedAt: publishedAt,
        proposalSentAt: sentAt,
        assignedAdvisorUid: session.uid,
        assignedAdvisorEmail: session.email ?? null,
        status: nextStatus,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      };
      if (sendToTraveler && (proposalSent || proposalSendDuplicate)) {
        requestPatch.contactedAt = clean(current.contactedAt, 50) || now;
      }
      transaction.update(requestRef, requestPatch);

      return {
        proposal: {
          shareId: proposal.shareId,
          href: proposalHref,
          title: proposal.plan.title,
          version,
          stopCount: proposal.plan.plan.length,
          publishedAt,
          sentAt,
          duplicate: duplicateProposal,
          sendQueued: proposalSent,
          sendDuplicate: proposalSendDuplicate,
        },
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
        console.error("travel advisor proposal delivery attempt failed", error);
      }
    }

    return NextResponse.json({ ok: true, proposal: result.proposal });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof ProposalActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("travel advisor proposal error", error);
    return NextResponse.json(
      { error: "Unable to publish this travel proposal right now." },
      { status: 500 },
    );
  }
}

function normalizeRequestId(value: unknown) {
  const id = clean(value, 80);
  return /^travel_[a-f0-9]{32}$/.test(id) ? id : "";
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

class ProposalActionError extends Error {
  constructor(
    message: string,
    public status: 404 | 409,
  ) {
    super(message);
  }
}
