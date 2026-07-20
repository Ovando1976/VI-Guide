import type { BookingStatus, RideBooking } from "@/types/mobility";

export type BookingWorkflowAction = {
  id: "accept" | "en_route" | "arrived" | "start" | "complete" | "cancel";
  label: string;
  nextStatus?: BookingStatus;
  tone: "primary" | "danger" | "neutral";
  requiresConfirmation: boolean;
};

const DRIVER_NEXT: Partial<Record<BookingStatus, BookingWorkflowAction>> = {
  matched: action("en_route", "Start driving to pickup", "driver_en_route"),
  driver_en_route: action("arrived", "I have arrived", "arrived"),
  arrived: action("start", "Start trip", "in_progress"),
  in_progress: action("complete", "Complete trip", "completed", true),
};

const REQUIRED_PREVIOUS: Partial<Record<BookingStatus, BookingStatus>> = {
  driver_en_route: "matched",
  arrived: "driver_en_route",
  in_progress: "arrived",
  completed: "in_progress",
};

export function assertBookingTransition(params: {
  booking: RideBooking;
  nextStatus: BookingStatus;
  actorType: "system" | "driver" | "rider" | "admin";
}) {
  const { booking, nextStatus, actorType } = params;
  if (booking.status === nextStatus) return "idempotent" as const;
  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new Error("This trip is already closed and cannot be changed.");
  }
  if (nextStatus === "cancelled") {
    if (actorType === "rider" && !["requested", "matched", "driver_en_route"].includes(booking.status)) {
      throw new Error("A rider cannot cancel after the driver has arrived. Contact dispatch for assistance.");
    }
    if (actorType === "driver" && booking.status !== "matched") {
      throw new Error("An active trip must be cancelled by dispatch with a recorded reason.");
    }
    return "transition" as const;
  }
  const required = REQUIRED_PREVIOUS[nextStatus];
  if (!required || booking.status !== required) {
    throw new Error(`Invalid trip transition from ${booking.status} to ${nextStatus}.`);
  }
  if (actorType === "rider") throw new Error("Riders cannot advance driver trip states.");
  if (!booking.driverId) throw new Error("A driver must be assigned before this trip can advance.");
  if (booking.paymentStatus !== "paid") throw new Error("Payment must clear before this trip can advance.");
  return "transition" as const;
}

export function getBookingWorkflow(booking: RideBooking, viewer: "rider" | "driver" | "dispatcher" | "admin") {
  const actions: BookingWorkflowAction[] = [];
  if (viewer === "driver") {
    const next = DRIVER_NEXT[booking.status];
    if (next) actions.push(next);
    if (booking.status === "matched") actions.push(cancelAction("Decline assignment"));
  }
  if (viewer === "rider" && ["requested", "matched", "driver_en_route"].includes(booking.status)) {
    actions.push(cancelAction("Cancel ride"));
  }
  if ((viewer === "dispatcher" || viewer === "admin") && !["completed", "cancelled"].includes(booking.status)) {
    actions.push(cancelAction("Cancel through dispatch"));
  }
  return {
    status: booking.status,
    actions,
    terminal: booking.status === "completed" || booking.status === "cancelled",
  };
}

function action(
  id: BookingWorkflowAction["id"],
  label: string,
  nextStatus: BookingStatus,
  requiresConfirmation = false,
): BookingWorkflowAction {
  return { id, label, nextStatus, tone: "primary", requiresConfirmation };
}

function cancelAction(label: string): BookingWorkflowAction {
  return { id: "cancel", label, nextStatus: "cancelled", tone: "danger", requiresConfirmation: true };
}
