import type {
  CruiseBooking,
  CruiseBookingRequest,
  CruiseCabinAvailability,
  CruiseCabinAvailabilityRequest,
  CruiseCancellationResult,
  CruiseHold,
  CruiseHoldRequest,
  CruiseInventoryProviderId,
  CruiseQuote,
  CruiseQuoteRequest,
  CruiseSailing,
  CruiseSearchRequest,
  CruiseSearchResponse,
} from "@/lib/cruise-inventory/types";

export interface CruiseInventoryProvider {
  readonly id: Exclude<CruiseInventoryProviderId, "disabled">;
  readonly live: boolean;

  searchSailings(request: CruiseSearchRequest): Promise<CruiseSearchResponse>;
  getSailing(sailingId: string): Promise<CruiseSailing>;
  getCabinAvailability(
    request: CruiseCabinAvailabilityRequest,
  ): Promise<CruiseCabinAvailability>;
  createQuote(request: CruiseQuoteRequest): Promise<CruiseQuote>;
  repriceQuote(quoteId: string): Promise<CruiseQuote>;
  holdCabin(request: CruiseHoldRequest): Promise<CruiseHold>;
  createBooking(request: CruiseBookingRequest): Promise<CruiseBooking>;
  retrieveBooking(bookingId: string): Promise<CruiseBooking>;
  cancelBooking(
    bookingId: string,
    reason: string,
  ): Promise<CruiseCancellationResult>;
}

export type CruiseProviderErrorCode =
  | "provider_disabled"
  | "provider_not_ready"
  | "invalid_request"
  | "not_found"
  | "price_changed"
  | "availability_changed"
  | "hold_expired"
  | "supplier_rejected"
  | "supplier_unavailable"
  | "booking_conflict"
  | "unsupported_operation";

export class CruiseProviderError extends Error {
  constructor(
    public readonly code: CruiseProviderErrorCode,
    message: string,
    public readonly status: 400 | 404 | 409 | 422 | 503 = 503,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "CruiseProviderError";
  }
}

export function isCruiseProviderError(
  error: unknown,
): error is CruiseProviderError {
  return error instanceof CruiseProviderError;
}
