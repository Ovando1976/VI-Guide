import { runConciergeBrain } from "./conciergeBrain";
import { buildConciergeRidePath, isRideRequest } from "./conciergeMobility";
import { inferBookingOption, saveBookingLead, wantsBooking } from "./conciergeBookings";
import type { ConciergeResolverInput, ConciergeResolverResult } from "./conciergeTypes";

export async function resolveConciergeRequest(
  input: ConciergeResolverInput,
): Promise<ConciergeResolverResult> {
  const userMessage = input.message.trim();

  if (
    (input.bookingSite && wantsBooking(userMessage)) ||
    input.location.search.includes("intent=book-tour")
  ) {
    const option = inferBookingOption(userMessage);
    const result = await saveBookingLead({
      option,
      note: userMessage,
      bookingSite: input.bookingSite,
      island: input.island,
      profile: input.profile,
      user: input.user,
      activeLeadId: input.activeLeadId,
    });

    if (result.leadId) input.setActiveLeadId?.(result.leadId);

    return {
      text: result.text,
      intent: "booking",
      activeLeadId: result.leadId,
    };
  }

  if (isRideRequest(userMessage)) {
    const path = buildConciergeRidePath({
      message: userMessage,
      island: input.island,
    });

    return {
      text:
        "I’ll send this into Mobility. Mobility will use the existing estate-based taxi system to resolve the pickup, destination, taxi zone, official fare, route preview, and ride request.",
      actions: [
        {
          type: "navigate",
          label: "Open Mobility Fare",
          path,
        },
      ],
      intent: "route",
    };
  }

  const brain = runConciergeBrain({
    message: userMessage,
    island: input.island,
    routeName: input.routeName,
    path: input.location.pathname,
    contextTitle: input.contextTitle,
    userLocation: input.userLocation,
  });

  let text = brain.answer;

  if (input.parcelContext) {
    text += `\n\nParcel context: ${input.parcelContext.label}, ${
      input.parcelContext.estateName || "unknown estate"
    }.`;
  }

  return {
    text,
    results: brain.results,
    actions: brain.actions,
    intent: brain.intent,
  };
}
