import { FieldValue } from "firebase-admin/firestore";

import { publishIntelligenceEvent } from "@/lib/intelligence/event-bus";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

const ACTION_RUN_COLLECTION = "intelligence_action_runs";

export type IntelligenceActionRisk = "low" | "medium" | "high";
export type IntelligenceActionStatus =
  | "pending_confirmation"
  | "running"
  | "completed"
  | "failed";

export type ActionExecutionContext = {
  sessionId: string;
  userId?: string;
  island: "stt" | "stj" | "stx";
  workflowId?: string;
  runId?: string;
};

export type ActionExecutionRequest = {
  actionId: string;
  confirmed?: boolean;
  payload?: Record<string, unknown>;
  context: ActionExecutionContext;
};

export type ActionExecutionResult = {
  executionId: string;
  actionId: string;
  status: IntelligenceActionStatus;
  requiresConfirmation: boolean;
  message: string;
  href?: string;
  data?: Record<string, unknown>;
};

type RegisteredAction = {
  id: string;
  name: string;
  description: string;
  risk: IntelligenceActionRisk;
  requiresConfirmation: boolean;
  execute(input: ActionExecutionRequest): Promise<Omit<ActionExecutionResult, "executionId" | "actionId" | "requiresConfirmation">>;
};

const actions = new Map<string, RegisteredAction>();

function registerAction(action: RegisteredAction) {
  if (actions.has(action.id)) throw new Error(`Duplicate action: ${action.id}`);
  actions.set(action.id, action);
  return action;
}

function ownerKey(context: ActionExecutionContext) {
  const raw = context.userId ? `user_${context.userId}` : `session_${context.sessionId}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
}

function stringPayload(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function persistExecution(
  request: ActionExecutionRequest,
  result: ActionExecutionResult,
  startedAt: number,
  error?: string,
) {
  if (!hasFirebaseAdminConfiguration()) return;
  try {
    await getAdminDb().collection(ACTION_RUN_COLLECTION).doc(result.executionId).set({
      executionId: result.executionId,
      actionId: result.actionId,
      status: result.status,
      requiresConfirmation: result.requiresConfirmation,
      ownerKey: ownerKey(request.context),
      sessionId: request.context.sessionId,
      ...(request.context.userId ? { userId: request.context.userId } : {}),
      island: request.context.island,
      ...(request.context.workflowId ? { workflowId: request.context.workflowId } : {}),
      ...(request.context.runId ? { runId: request.context.runId } : {}),
      payloadKeys: Object.keys(request.payload ?? {}).slice(0, 30),
      message: result.message.slice(0, 500),
      ...(result.href ? { href: result.href } : {}),
      ...(error ? { error: error.slice(0, 800) } : {}),
      durationMs: Date.now() - startedAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (persistError) {
    console.warn("Action telemetry did not block execution.", persistError);
  }
}

registerAction({
  id: "map.open",
  name: "Open Map",
  description: "Open the USVI Explorer map focused on a selected island or place.",
  risk: "low",
  requiresConfirmation: false,
  async execute(input) {
    const placeId = stringPayload(input.payload, "placeId");
    const query = new URLSearchParams({ island: input.context.island });
    if (placeId) query.set("place", placeId);
    return {
      status: "completed",
      message: "Map handoff is ready.",
      href: `/map?${query.toString()}`,
    };
  },
});

registerAction({
  id: "trip.save",
  name: "Save Trip",
  description: "Save the current itinerary and workflow state for later continuation.",
  risk: "medium",
  requiresConfirmation: false,
  async execute(input) {
    const title = stringPayload(input.payload, "title") ?? "My USVI Explorer Trip";
    if (!hasFirebaseAdminConfiguration()) {
      return {
        status: "failed",
        message: "Trip saving is temporarily unavailable because persistent storage is not configured.",
      };
    }
    const tripId = stringPayload(input.payload, "tripId") ?? crypto.randomUUID();
    await getAdminDb().collection("traveler_trips").doc(tripId).set({
      ownerKey: ownerKey(input.context),
      sessionId: input.context.sessionId,
      ...(input.context.userId ? { userId: input.context.userId } : {}),
      island: input.context.island,
      title,
      workflowId: input.context.workflowId ?? null,
      itinerary: Array.isArray(input.payload?.itinerary) ? input.payload?.itinerary : [],
      status: "saved",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
      status: "completed",
      message: "Trip saved successfully.",
      href: `/trips/${tripId}`,
      data: { tripId },
    };
  },
});

registerAction({
  id: "mobility.prepare",
  name: "Prepare Ride",
  description: "Prepare a transportation request without dispatching a driver.",
  risk: "medium",
  requiresConfirmation: true,
  async execute(input) {
    const from = stringPayload(input.payload, "from");
    const to = stringPayload(input.payload, "to");
    if (!from || !to) {
      return {
        status: "failed",
        message: "Pickup and destination are required before preparing transportation.",
      };
    }
    const query = new URLSearchParams({ island: input.context.island, from, to });
    return {
      status: "completed",
      message: "Transportation request is prepared. No driver has been dispatched.",
      href: `/mobility?${query.toString()}`,
      data: { from, to, dispatched: false },
    };
  },
});

registerAction({
  id: "booking.prepare",
  name: "Prepare Booking",
  description: "Prepare a booking review without placing a reservation or charging payment.",
  risk: "high",
  requiresConfirmation: true,
  async execute(input) {
    const listingId = stringPayload(input.payload, "listingId");
    if (!listingId) {
      return {
        status: "failed",
        message: "A listing is required before preparing a booking.",
      };
    }
    return {
      status: "completed",
      message: "Booking review is ready. No reservation or payment has been submitted.",
      href: `/book/${encodeURIComponent(listingId)}?review=1`,
      data: { listingId, reservationPlaced: false, paymentCaptured: false },
    };
  },
});

export function listRegisteredActions() {
  return Array.from(actions.values()).map(({ execute: _execute, ...action }) => action);
}

export async function executeRegisteredAction(request: ActionExecutionRequest): Promise<ActionExecutionResult> {
  const action = actions.get(request.actionId);
  const executionId = crypto.randomUUID();
  const startedAt = Date.now();

  if (!action) {
    const result: ActionExecutionResult = {
      executionId,
      actionId: request.actionId,
      status: "failed",
      requiresConfirmation: false,
      message: "Unknown action.",
    };
    await persistExecution(request, result, startedAt, result.message);
    return result;
  }

  if (action.requiresConfirmation && request.confirmed !== true) {
    const result: ActionExecutionResult = {
      executionId,
      actionId: action.id,
      status: "pending_confirmation",
      requiresConfirmation: true,
      message: `Confirm before continuing with ${action.name}.`,
    };
    await persistExecution(request, result, startedAt);
    return result;
  }

  try {
    const executed = await action.execute(request);
    const result: ActionExecutionResult = {
      executionId,
      actionId: action.id,
      requiresConfirmation: action.requiresConfirmation,
      ...executed,
    };
    await persistExecution(request, result, startedAt, result.status === "failed" ? result.message : undefined);
    await publishIntelligenceEvent({
      type: result.status === "completed" ? "action.completed" : "action.failed",
      ownerKey: ownerKey(request.context),
      ...(request.context.workflowId ? { workflowId: request.context.workflowId } : {}),
      runId: request.context.runId ?? executionId,
      island: request.context.island,
      intent: action.id,
      payload: {
        executionId,
        actionId: action.id,
        status: result.status,
        requiresConfirmation: action.requiresConfirmation,
      },
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result: ActionExecutionResult = {
      executionId,
      actionId: action.id,
      status: "failed",
      requiresConfirmation: action.requiresConfirmation,
      message: "The action could not be completed.",
    };
    await persistExecution(request, result, startedAt, message);
    return result;
  }
}
