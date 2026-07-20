import type { RideBooking, TaxiRateReviewRequest } from "./mobility";
import type { TripEvent } from "./trip-event";

export type RiderDriverSummary = {
  id: string;
  name: string;
  rating: number | null;
};

export type RiderVehicleSummary = {
  id: string;
  make: string | null;
  model: string | null;
  color: string | null;
  taxiPlate: string | null;
};

export type RiderBookingOperations = {
  booking: RideBooking;
  events: TripEvent[];
  driver: RiderDriverSummary | null;
  vehicle: RiderVehicleSummary | null;
  canCancel: boolean;
  nextMessage: string;
};

export type RiderOperationsPayload = {
  bookings: RiderBookingOperations[];
  rateReviews: TaxiRateReviewRequest[];
  generatedAt: string;
};
