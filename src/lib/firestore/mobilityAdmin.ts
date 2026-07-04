import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../../firebase";
import type { MobilityIsland, Trip } from "../../types";
import { TRIPS_COL } from "./mobility";

export type MobilityTripStatus =
  | "requested"
  | "matched"
  | "accepted"
  | "driver_arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "quoted"
  | "assigned"
  | "closed";

export type PaymentStatus =
  | "unpaid"
  | "payment_sent"
  | "paid"
  | "cash"
  | "comped";

export type DriverProfile = {
  id: string;
  uid?: string;
  name: string;
  phone: string;
  email?: string;
  island: MobilityIsland;
  licenseNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  capacity: number;
  acceptsShared: boolean;
  acceptsPrivate: boolean;
  active: boolean;
  online: boolean;
  verified: boolean;
  currentTripId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AdminMobilityTrip = Omit<Trip, "status"> & {
  status?: MobilityTripStatus;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverPhone?: string | null;
  paymentStatus?: PaymentStatus;
  dispatcherNotes?: string;
  driverNotes?: string;
  customerNotes?: string;
  assignedAt?: unknown;
  completedAt?: unknown;
  updatedAt?: unknown;
};

export type DriverProfileInput = Omit<
  DriverProfile,
  "id" | "createdAt" | "updatedAt"
>;

export const MOBILITY_TRIPS_COLLECTION = TRIPS_COL;
export const DRIVER_PROFILES_COLLECTION = "driverProfiles";

function normalizeTrip(id: string, data: Record<string, any>): AdminMobilityTrip {
  return {
    id,
    ...data,
    paymentStatus: data.paymentStatus || "unpaid",
    assignedDriverId: data.assignedDriverId || null,
    assignedDriverName: data.assignedDriverName || null,
    assignedDriverPhone: data.assignedDriverPhone || null,
  } as AdminMobilityTrip;
}

function normalizeDriver(id: string, data: Record<string, any>): DriverProfile {
  return {
    id,
    uid: data.uid || "",
    name: data.name || "Unnamed Driver",
    phone: data.phone || "",
    email: data.email || "",
    island: data.island || "stt",
    licenseNumber: data.licenseNumber || "",
    vehicleMake: data.vehicleMake || "",
    vehicleModel: data.vehicleModel || "",
    vehiclePlate: data.vehiclePlate || "",
    capacity: Number(data.capacity || 4),
    acceptsShared: Boolean(data.acceptsShared ?? true),
    acceptsPrivate: Boolean(data.acceptsPrivate ?? true),
    active: Boolean(data.active ?? true),
    online: Boolean(data.online ?? false),
    verified: Boolean(data.verified ?? false),
    currentTripId: data.currentTripId || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function subscribeAdminMobilityTrips(
  callback: (trips: AdminMobilityTrip[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, MOBILITY_TRIPS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(80),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => normalizeTrip(item.id, item.data())));
  });
}

export function subscribeDriverProfiles(
  callback: (drivers: DriverProfile[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, DRIVER_PROFILES_COLLECTION),
    orderBy("name", "asc"),
    limit(100),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => normalizeDriver(item.id, item.data())));
  });
}

export function subscribeAssignedDriverTrips(
  driverId: string,
  callback: (trips: AdminMobilityTrip[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, MOBILITY_TRIPS_COLLECTION),
    where("assignedDriverId", "==", driverId),
    limit(40),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => normalizeTrip(item.id, item.data())));
  });
}

export async function createDriverProfile(input: DriverProfileInput) {
  return addDoc(collection(db, DRIVER_PROFILES_COLLECTION), {
    ...input,
    active: input.active ?? true,
    online: input.online ?? false,
    verified: input.verified ?? false,
    capacity: input.capacity || 4,
    acceptsShared: input.acceptsShared ?? true,
    acceptsPrivate: input.acceptsPrivate ?? true,
    currentTripId: input.currentTripId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDriverProfile(
  driverId: string,
  updates: Partial<DriverProfileInput>,
) {
  return updateDoc(doc(db, DRIVER_PROFILES_COLLECTION, driverId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function setDriverOnline(driverId: string, online: boolean) {
  return updateDoc(doc(db, DRIVER_PROFILES_COLLECTION, driverId), {
    online,
    updatedAt: serverTimestamp(),
  });
}

export async function assignDriverToTrip(tripId: string, driver: DriverProfile) {
  await updateDoc(doc(db, MOBILITY_TRIPS_COLLECTION, tripId), {
    status: "assigned",
    assignedDriverId: driver.id,
    assignedDriverName: driver.name,
    assignedDriverPhone: driver.phone,
    updatedAt: serverTimestamp(),
    assignedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, DRIVER_PROFILES_COLLECTION, driver.id), {
    currentTripId: tripId,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTripStatus(
  tripId: string,
  status: MobilityTripStatus,
  extras: Record<string, unknown> = {},
) {
  const payload: Record<string, unknown> = {
    status,
    ...extras,
    updatedAt: serverTimestamp(),
  };

  if (status === "completed" || status === "closed") {
    payload.completedAt = serverTimestamp();
  }

  return updateDoc(doc(db, MOBILITY_TRIPS_COLLECTION, tripId), payload);
}

export async function updateTripPaymentStatus(
  tripId: string,
  paymentStatus: PaymentStatus,
) {
  return updateDoc(doc(db, MOBILITY_TRIPS_COLLECTION, tripId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function addDispatcherNotes(
  tripId: string,
  dispatcherNotes: string,
) {
  return updateDoc(doc(db, MOBILITY_TRIPS_COLLECTION, tripId), {
    dispatcherNotes,
    updatedAt: serverTimestamp(),
  });
}

export async function addDriverNotes(tripId: string, driverNotes: string) {
  return updateDoc(doc(db, MOBILITY_TRIPS_COLLECTION, tripId), {
    driverNotes,
    updatedAt: serverTimestamp(),
  });
}

function locationLabel(location: any) {
  return (
    location?.label ||
    location?.zoneName ||
    location?.zoneId ||
    location?.id ||
    "Not set"
  );
}

export function buildTripDispatchBrief(trip: AdminMobilityTrip) {
  const pickup = trip.pickupLabel || locationLabel(trip.pickup);
  const dropoff = trip.dropoffLabel || locationLabel(trip.dropoff);

  return [
    "VI Guide Dispatch Brief",
    "",
    `Trip: #${trip.id.slice(-6)}`,
    `Status: ${String(trip.status || "requested").replace("_", " ")}`,
    `Island: ${trip.island}`,
    `Pickup: ${pickup}`,
    `Dropoff: ${dropoff}`,
    `Trip type: ${String(trip.tripType || "direct").replace("_", " ")}`,
    `Service: ${trip.serviceClass || "shared"}`,
    `Passengers: ${trip.passengers || 1}`,
    `Luggage: ${trip.luggage || 0}`,
    `Fare: $${trip.quote?.total ?? "Pending"}`,
    trip.assignedDriverName ? `Driver: ${trip.assignedDriverName}` : "Driver: Unassigned",
    trip.assignedDriverPhone ? `Driver phone: ${trip.assignedDriverPhone}` : "",
    trip.customerPhone ? `Customer phone: ${trip.customerPhone}` : "",
    "",
    "Coordinate pickup, confirm timing, and update status.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDriverSmsText(trip: AdminMobilityTrip) {
  return encodeURIComponent(buildTripDispatchBrief(trip));
}

export function getTripPickupLabel(trip: AdminMobilityTrip) {
  return trip.pickupLabel || locationLabel(trip.pickup);
}

export function getTripDropoffLabel(trip: AdminMobilityTrip) {
  return trip.dropoffLabel || locationLabel(trip.dropoff);
}
