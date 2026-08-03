import {
  registerAgentEventHandler,
  type IntelligenceEvent,
} from "@/lib/intelligence/event-bus";

function payloadString(event: IntelligenceEvent, key: string) {
  const value = event.payload[key];
  return typeof value === "string" ? value : undefined;
}

registerAgentEventHandler({
  agentId: "travel-planner",
  eventTypes: ["workflow.created", "workflow.resumed", "trip.planned"],
  async handle(event) {
    const status = payloadString(event, "workflowStatus") ?? "active";
    return {
      status: "completed",
      detail: `Travel Planner synchronized the ${event.intent} workflow in ${status} state.`,
    };
  },
});

registerAgentEventHandler({
  agentId: "mobility-coordinator",
  eventTypes: ["trip.planned", "mobility.requested", "workflow.updated"],
  async handle(event) {
    const needsMobility = Boolean(event.payload.requiresMobility);
    return needsMobility
      ? {
          status: "completed",
          detail: "Mobility Coordinator marked transportation as part of the active workflow.",
        }
      : {
          status: "skipped",
          detail: "No mobility coordination was required for this event.",
        };
  },
});

registerAgentEventHandler({
  agentId: "booking-guardian",
  eventTypes: ["booking.reviewed", "workflow.waiting"],
  async handle(event) {
    const missing = Array.isArray(event.payload.missingInformation)
      ? event.payload.missingInformation.map(String)
      : [];
    return {
      status: "completed",
      detail: missing.length
        ? `Booking Guardian preserved the confirmation boundary while waiting for ${missing.join(", ")}.`
        : "Booking Guardian verified that protected actions remain confirmation-gated.",
    };
  },
});

registerAgentEventHandler({
  agentId: "memory-curator",
  eventTypes: [
    "memory.updated",
    "workflow.created",
    "workflow.updated",
    "workflow.resumed",
  ],
  async handle(event) {
    return {
      status: "completed",
      detail: `Memory Curator linked event ${event.type} to workflow ${event.workflowId ?? "unassigned"}.`,
    };
  },
});
