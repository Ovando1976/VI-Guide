import {
  CYRIL_E_KING_AIRPORT_GEOID,
  RED_HOOK_FERRY_TERMINAL_GEOID,
} from "@/lib/mobility-hubs";
import { getSttDispatchHub } from "@/lib/stt-dispatch-hubs";

export type SharedDispatchBooking = {
  id: string;
  island?: string;
  status?: string;
  paymentStatus?: string;
  paymentIntegrityStatus?: string;
  serviceExpectation?: string;
  dispatchPolicy?: { serviceExpectation?: string };
  passengers?: number;
  luggage?: number;
  connectionDeadline?: string | null;
  origin?: { estateGeoid?: string; estateName?: string };
  destination?: { estateGeoid?: string; estateName?: string };
};

export type SharedDispatchDriver = {
  id: string;
  islands?: string[];
  verified?: boolean;
  authorizationStatus?: string;
  availability?: string;
  associationId?: string;
  vehicleId?: string;
  airportCertified?: boolean;
  ferryCertified?: boolean;
};

export type SharedDispatchVehicle = {
  id: string;
  driverId?: string;
  associationId?: string;
  type?: string;
  capacity?: number;
  luggageCapacity?: number;
  active?: boolean;
};

export type SharedDispatchFleetFit = {
  driverId: string;
  vehicleId: string;
  vehicleType: "van" | "safari";
  capacity: number;
  luggageCapacity: number;
  spareSeats: number;
  spareLuggage: number;
};

export type SharedDispatchGroup = {
  key: string;
  originGeoid: string;
  originName: string;
  destinationGeoid: string;
  destinationName: string;
  bookingIds: string[];
  partyCount: number;
  passengers: number;
  luggage: number;
  earliestConnectionDeadline: string | null;
  fleetFits: SharedDispatchFleetFit[];
  queueConfirmationRequired: true;
  pricingEffect: "none";
};

function positiveCount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function nonNegativeCount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function sharedExpectation(booking: SharedDispatchBooking) {
  return (
    booking.dispatchPolicy?.serviceExpectation ?? booking.serviceExpectation ?? ""
  );
}

function isGroupableBooking(booking: SharedDispatchBooking) {
  if (booking.island !== "stt") return false;
  if (booking.status !== "requested") return false;
  if (booking.paymentStatus !== "paid") return false;
  if (booking.paymentIntegrityStatus !== "verified") return false;
  if (sharedExpectation(booking) !== "shared") return false;
  if (!booking.origin?.estateGeoid || !booking.destination?.estateGeoid) return false;
  if (!getSttDispatchHub(booking.origin.estateGeoid)) return false;
  return positiveCount(booking.passengers) > 0;
}

function earliestDeadline(bookings: SharedDispatchBooking[]) {
  const candidates = bookings
    .map((booking) => booking.connectionDeadline)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, timestamp: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
  return candidates[0]?.value ?? null;
}

function fleetFitsForGroup(params: {
  originGeoid: string;
  passengers: number;
  luggage: number;
  drivers: SharedDispatchDriver[];
  vehicles: SharedDispatchVehicle[];
}) {
  const vehicleById = new Map(params.vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return params.drivers
    .flatMap((driver): SharedDispatchFleetFit[] => {
      if (driver.verified !== true || driver.authorizationStatus !== "active") return [];
      if (driver.availability !== "available") return [];
      if (!driver.associationId || !driver.vehicleId) return [];
      if (!Array.isArray(driver.islands) || !driver.islands.includes("stt")) return [];
      if (
        params.originGeoid === CYRIL_E_KING_AIRPORT_GEOID &&
        driver.airportCertified !== true
      ) {
        return [];
      }
      if (
        params.originGeoid === RED_HOOK_FERRY_TERMINAL_GEOID &&
        driver.ferryCertified !== true
      ) {
        return [];
      }

      const vehicle = vehicleById.get(driver.vehicleId);
      if (!vehicle || vehicle.active !== true) return [];
      if (vehicle.driverId !== driver.id || vehicle.associationId !== driver.associationId) return [];
      if (vehicle.type !== "van" && vehicle.type !== "safari") return [];

      const capacity = positiveCount(vehicle.capacity);
      const luggageCapacity = nonNegativeCount(vehicle.luggageCapacity);
      if (capacity < params.passengers || luggageCapacity < params.luggage) return [];

      return [
        {
          driverId: driver.id,
          vehicleId: vehicle.id,
          vehicleType: vehicle.type,
          capacity,
          luggageCapacity,
          spareSeats: capacity - params.passengers,
          spareLuggage: luggageCapacity - params.luggage,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.spareSeats - b.spareSeats ||
        a.spareLuggage - b.spareLuggage ||
        a.vehicleId.localeCompare(b.vehicleId),
    );
}

export function buildSttSharedDispatchGroups(params: {
  bookings: SharedDispatchBooking[];
  drivers: SharedDispatchDriver[];
  vehicles: SharedDispatchVehicle[];
}): SharedDispatchGroup[] {
  const buckets = new Map<string, SharedDispatchBooking[]>();

  for (const booking of params.bookings) {
    if (!isGroupableBooking(booking)) continue;
    const originGeoid = booking.origin!.estateGeoid!;
    const destinationGeoid = booking.destination!.estateGeoid!;
    const key = `${originGeoid}::${destinationGeoid}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(booking);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, bookings]) => bookings.length >= 2)
    .map(([key, bookings]) => {
      const first = bookings[0];
      const hub = getSttDispatchHub(first.origin!.estateGeoid!);
      const passengers = bookings.reduce(
        (sum, booking) => sum + positiveCount(booking.passengers),
        0,
      );
      const luggage = bookings.reduce(
        (sum, booking) => sum + nonNegativeCount(booking.luggage),
        0,
      );
      const originGeoid = first.origin!.estateGeoid!;
      const destinationGeoid = first.destination!.estateGeoid!;

      return {
        key,
        originGeoid,
        originName: hub?.label ?? first.origin?.estateName ?? "STT pickup hub",
        destinationGeoid,
        destinationName: first.destination?.estateName ?? "Governed destination",
        bookingIds: bookings.map((booking) => booking.id).sort(),
        partyCount: bookings.length,
        passengers,
        luggage,
        earliestConnectionDeadline: earliestDeadline(bookings),
        fleetFits: fleetFitsForGroup({
          originGeoid,
          passengers,
          luggage,
          drivers: params.drivers,
          vehicles: params.vehicles,
        }),
        queueConfirmationRequired: true as const,
        pricingEffect: "none" as const,
      };
    })
    .sort((a, b) => {
      const aDeadline = a.earliestConnectionDeadline
        ? Date.parse(a.earliestConnectionDeadline)
        : Number.POSITIVE_INFINITY;
      const bDeadline = b.earliestConnectionDeadline
        ? Date.parse(b.earliestConnectionDeadline)
        : Number.POSITIVE_INFINITY;
      return aDeadline - bDeadline || b.passengers - a.passengers;
    });
}
