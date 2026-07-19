export type TripEventType =
  | "booking_requested"
  | "driver_matched"
  | "driver_en_route"
  | "driver_arrived"
  | "trip_started"
  | "trip_completed"
  | "trip_cancelled";

export type TripEvent = {
  id: string;
  bookingId: string;
  type: TripEventType;
  actorType: "system" | "driver" | "rider" | "admin";
  actorId?: string;
  message: string;
  createdAt: string;
};