import type {
  AdvisorCommerceBooking,
  AdvisorCommerceSummary,
} from "@/lib/travel-advisor-commerce";

export type TravelAdvisorConversionStage =
  | "lead"
  | "planning"
  | "proposal_sent"
  | "booking_requested"
  | "payment_required"
  | "paid"
  | "confirmed"
  | "completed"
  | "needs_alternative"
  | "closed";

export type TravelAdvisorConversionInput = {
  status: string;
  proposalSentAt: string | null;
  commerceBookings: AdvisorCommerceBooking[];
  commerceSummary: AdvisorCommerceSummary;
};

export function travelAdvisorConversionStage(
  input: TravelAdvisorConversionInput,
): TravelAdvisorConversionStage {
  if (input.status === "closed") return "closed";

  const bookings = input.commerceBookings;
  const summary = input.commerceSummary;
  if (bookings.length) {
    const viable = bookings.filter(
      (booking) => booking.status !== "declined" && booking.status !== "cancelled",
    );
    if (!viable.length) return "needs_alternative";
    if (
      summary.completedBookings > 0 &&
      summary.completedBookings === viable.length
    ) {
      return "completed";
    }
    if (summary.confirmedBookings > 0) return "confirmed";
    if (summary.paidBookings > 0) return "paid";
    if (summary.paymentRequired > 0) return "payment_required";
    return "booking_requested";
  }

  if (input.proposalSentAt) return "proposal_sent";
  if (["reviewing", "planned", "contacted"].includes(input.status)) {
    return "planning";
  }
  return "lead";
}

export function travelAdvisorConversionLabel(stage: TravelAdvisorConversionStage) {
  const labels: Record<TravelAdvisorConversionStage, string> = {
    lead: "New lead",
    planning: "Planning",
    proposal_sent: "Proposal sent",
    booking_requested: "Booking requested",
    payment_required: "Payment required",
    paid: "Paid",
    confirmed: "Confirmed",
    completed: "Completed",
    needs_alternative: "Alternative needed",
    closed: "Closed",
  };
  return labels[stage];
}

export function travelAdvisorNextAction(stage: TravelAdvisorConversionStage) {
  const actions: Record<TravelAdvisorConversionStage, string> = {
    lead: "Review the traveler request and begin the planning brief.",
    planning: "Finish the itinerary and publish a traveler-ready proposal.",
    proposal_sent:
      "Watch for traveler booking intent or follow up when appropriate.",
    booking_requested:
      "Coordinate provider review and availability confirmation.",
    payment_required: "Traveler payment is the next conversion step.",
    paid:
      "Payment is recorded; provider confirmation is the next operational step.",
    confirmed:
      "Reservation is confirmed; manage fulfillment through the trip date.",
    completed: "Trip component is complete and recorded in revenue.",
    needs_alternative:
      "The current booking path failed; prepare a suitable alternative.",
    closed: "No further conversion action is expected from this request.",
  };
  return actions[stage];
}

export function summarizeTravelAdvisorFunnel(
  requests: Array<{
    proposalSentAt: string | null;
    commerceSummary: AdvisorCommerceSummary;
  }>,
) {
  const leads = requests.length;
  const proposalsSent = requests.filter((request) =>
    Boolean(request.proposalSentAt),
  ).length;
  const bookingRequests = requests.reduce(
    (total, request) => total + request.commerceSummary.totalBookings,
    0,
  );
  const travelersWithBookings = requests.filter(
    (request) => request.commerceSummary.totalBookings > 0,
  ).length;
  const confirmed = requests.reduce(
    (total, request) => total + request.commerceSummary.confirmedBookings,
    0,
  );
  const travelersConfirmed = requests.filter(
    (request) => request.commerceSummary.confirmedBookings > 0,
  ).length;
  const paidAmountCents = requests.reduce(
    (total, request) => total + request.commerceSummary.paidAmountCents,
    0,
  );

  return {
    leads,
    proposalsSent,
    bookingRequests,
    travelersWithBookings,
    confirmed,
    travelersConfirmed,
    paidAmountCents,
    leadToProposalRate: percent(proposalsSent, leads),
    proposalToBookingRate: percent(travelersWithBookings, proposalsSent),
    bookingToConfirmationRate: percent(
      travelersConfirmed,
      travelersWithBookings,
    ),
  };
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}
