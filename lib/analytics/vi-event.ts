export const VI_EVENT_SCHEMA_VERSION = 1 as const;

export type VIEventOrigin = "client" | "server";

export type VIIsland = "st_thomas" | "st_john" | "st_croix" | "water_island";
export type VITravelerType = "cruise" | "stayover" | "local";

export type ClientVIEventName =
  | "landing_view"
  | "intent_selected"
  | "listing_opened"
  | "concierge_started"
  | "ai_query_submitted"
  | "recommendation_served"
  | "ride_started"
  | "quote_generated"
  | "auth_started"
  | "account_created"
  | "checkout_started"
  | "offer_viewed"
  | "offer_requested"
  | "trip_created"
  | "plan_created"
  | "plan_item_added"
  | "itinerary_4h_selected"
  | "itinerary_6h_selected"
  | "itinerary_8h_selected"
  | "cruise_day_started"
  | "return_to_ship_planned"
  | "transport_requested"
  | "booking_started"
  | "lead_forwarded"
  | "purchase_return_viewed";

export type FinancialVIEventName =
  | "payment_completed"
  | "booking_confirmed"
  | "commission_generated"
  | "refund_completed";

export type VIEventName = ClientVIEventName | FinancialVIEventName;

export type VIEventPayloadValue = string | number | boolean | null;
export type VIEventPayload = Record<string, VIEventPayloadValue>;

export type VIEvent<TPayload extends VIEventPayload = VIEventPayload> = {
  eventId: string;
  eventName: VIEventName;
  schemaVersion: typeof VI_EVENT_SCHEMA_VERSION;
  origin: VIEventOrigin;
  occurredAt: string;
  receivedAt?: string;
  sessionId: string;
  userId?: string;
  island?: VIIsland;
  travelerType?: VITravelerType;
  source?: string;
  itineraryId?: string;
  listingId?: string;
  providerId?: string;
  bookingId?: string;
  payload: TPayload;
};

export const CLIENT_VI_EVENT_NAMES = new Set<ClientVIEventName>([
  "landing_view",
  "intent_selected",
  "listing_opened",
  "concierge_started",
  "ai_query_submitted",
  "recommendation_served",
  "ride_started",
  "quote_generated",
  "auth_started",
  "account_created",
  "checkout_started",
  "offer_viewed",
  "offer_requested",
  "trip_created",
  "plan_created",
  "plan_item_added",
  "itinerary_4h_selected",
  "itinerary_6h_selected",
  "itinerary_8h_selected",
  "cruise_day_started",
  "return_to_ship_planned",
  "transport_requested",
  "booking_started",
  "lead_forwarded",
  "purchase_return_viewed",
]);

export const FINANCIAL_VI_EVENT_NAMES = new Set<FinancialVIEventName>([
  "payment_completed",
  "booking_confirmed",
  "commission_generated",
  "refund_completed",
]);

export function isClientVIEventName(value: unknown): value is ClientVIEventName {
  return typeof value === "string" && CLIENT_VI_EVENT_NAMES.has(value as ClientVIEventName);
}

export function isFinancialVIEventName(value: unknown): value is FinancialVIEventName {
  return typeof value === "string" && FINANCIAL_VI_EVENT_NAMES.has(value as FinancialVIEventName);
}
