import type { User } from "firebase/auth";

import { createTourLead, updateTourLead } from "../../lib/firestore/tourLeads";
import type { IslandCode, UserProfile } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import { getHistoricSiteOffer } from "../../data/revenue/historicSiteOffers";
import type { BookingOption } from "./conciergeTypes";

export function inferBookingOption(text: string): BookingOption {
  const lower = text.toLowerCase();

  if (lower.includes("bundle") || (lower.includes("tour") && lower.includes("ride"))) {
    return "bundle";
  }

  if (
    lower.includes("ride") ||
    lower.includes("taxi") ||
    lower.includes("pickup") ||
    lower.includes("drive") ||
    lower.includes("transport")
  ) {
    return "ride";
  }

  return "tour";
}

export function wantsBooking(text: string) {
  const lower = text.toLowerCase();
  return ["book", "reserve", "tour", "bundle", "schedule", "price"].some((word) =>
    lower.includes(word),
  );
}

export function extractLeadDetails(text: string) {
  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;

  const phone =
    text.match(/(?:\+?1[-.\s]?)?(?:\(?340\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/)
      ?.[0] ?? null;

  const guestMatch =
    text.match(/(?:party of|guests?|people|persons?|for)\s+(\d{1,2})/i) ||
    text.match(/(\d{1,2})\s+(?:guests?|people|persons?)/i);

  const dateMatch =
    text.match(
      /\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[^,.]*/i,
    )?.[0] ?? null;

  const pickupMatch =
    text.match(/(?:pickup|pick up|from)\s+(?:at\s+)?([^,.]+)/i)?.[1]?.trim() ??
    null;

  return {
    customerEmail: email,
    customerPhone: phone,
    guestCount: guestMatch ? Number(guestMatch[1]) : null,
    preferredDate: dateMatch,
    pickupLocation: pickupMatch,
    specialRequests: text.trim() || null,
  };
}

export async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Request timed out")), ms);
    }),
  ]);
}

export async function saveBookingLead(input: {
  option: BookingOption;
  note?: string;
  bookingSite?: GeographicIndexItem | null;
  urlContext?: string;
  island: IslandCode;
  profile?: UserProfile | null;
  user?: User | null;
  activeLeadId?: string | null;
}): Promise<{ text: string; leadId?: string | null }> {
  const { option, note, bookingSite, urlContext, island, profile, user, activeLeadId } =
    input;

  const bookingOffer = getHistoricSiteOffer(bookingSite?.id);
  const siteName = bookingSite?.name || urlContext || "this historic site";
  const details = extractLeadDetails(note || "");

  const estimatedValue =
    option === "ride"
      ? 5
      : option === "bundle"
        ? (bookingOffer?.tourPrice || 35) + 12
        : bookingOffer?.tourPrice || 35;

  if (activeLeadId) {
    await withTimeout(
      updateTourLead(activeLeadId, {
        intent: option,
        estimatedValue,
        customerEmail: details.customerEmail,
        customerPhone: details.customerPhone,
        guestCount: details.guestCount,
        preferredDate: details.preferredDate,
        pickupLocation: details.pickupLocation,
        specialRequests: details.specialRequests,
      }),
      8000,
    );

    return {
      leadId: activeLeadId,
      text: `I updated the existing **${option} lead** for **${siteName}**.

${note ? `Added note: ${note}\n\n` : ""}To finish the booking, confirm:

- Full name
- Phone number
- Email
- Number of guests
- Preferred date and time
- Pickup location, if transportation is needed`,
    };
  }

  const leadId = await withTimeout(
    createTourLead({
      siteId: bookingSite?.id,
      siteName,
      island,
      intent: option,
      customerName: profile?.displayName || user?.displayName || null,
      customerEmail: details.customerEmail || user?.email || null,
      customerPhone: details.customerPhone,
      guestCount: details.guestCount,
      preferredDate: details.preferredDate,
      pickupLocation: details.pickupLocation,
      specialRequests: details.specialRequests,
      userId: user?.uid || null,
      estimatedValue,
      source: "ambient-concierge",
    }),
    8000,
  );

  return {
    leadId,
    text: `Done — I created a **${option} lead** for **${siteName}**.

${note ? `Your note: ${note}\n\n` : ""}Next, confirm:

- Full name
- Phone number
- Email
- Number of guests
- Preferred date and time
- Pickup location, if transportation is needed`,
  };
}
