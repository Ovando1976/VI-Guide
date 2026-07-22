import "server-only";

import type { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";
import type { RideBooking } from "@/types/mobility";
import type { DriverProfile, VehicleRecord } from "@/types/driver";
import type { TaxiAssociation } from "@/types/taxi-operations";

function hasCurrentExpiration(value?: string | null) {
  if (!value) return false;
  const expiresAt = Date.parse(value);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function assertDispatchEligible(params: {
  booking: RideBooking;
  driverSnapshot: DocumentSnapshot<DocumentData>;
  vehicleSnapshot: DocumentSnapshot<DocumentData>;
  associationSnapshot: DocumentSnapshot<DocumentData>;
  allowedAvailability?: DriverProfile["availability"][];
}) {
  if (!params.driverSnapshot.exists) throw new Error("Driver record not found.");
  if (!params.vehicleSnapshot.exists) throw new Error("Assigned fleet vehicle not found.");
  if (!params.associationSnapshot.exists) throw new Error("Taxi association record not found.");

  const driver = { id: params.driverSnapshot.id, ...params.driverSnapshot.data() } as DriverProfile;
  const vehicle = { id: params.vehicleSnapshot.id, ...params.vehicleSnapshot.data() } as VehicleRecord;
  const association = { id: params.associationSnapshot.id, ...params.associationSnapshot.data() } as TaxiAssociation;
  const allowedAvailability = params.allowedAvailability ?? ["available"];

  if (!driver.verified || driver.authorizationStatus !== "active") throw new Error("Driver is not actively authorized for taxi dispatch.");
  if (!driver.taxiCommissionBadgeNumber || !hasCurrentExpiration(driver.taxiCommissionBadgeExpiresAt)) throw new Error("Driver Taxicab Commission credential is missing, invalid, or expired.");
  if (!driver.licenseClass || !hasCurrentExpiration(driver.licenseExpiresAt)) throw new Error("Driver license credential is missing, invalid, or expired.");
  if (!allowedAvailability.includes(driver.availability)) throw new Error("Driver availability is not valid for this trip action.");
  if (!driver.islands.includes(params.booking.island)) throw new Error("Driver is not authorized for the booking island.");
  if (!driver.associationId || driver.associationId !== association.id || association.status !== "active") throw new Error("Driver does not belong to an active taxi association.");
  if (params.booking.associationId && params.booking.associationId !== association.id) throw new Error("Driver belongs to a different taxi association than the assigned dispatch.");
  if (!vehicle.active || vehicle.driverId !== driver.id || vehicle.associationId !== association.id) throw new Error("Vehicle is not active in the driver's association fleet.");
  if (vehicle.inspectionStatus !== "active" || !hasCurrentExpiration(vehicle.inspectionExpiresAt)) throw new Error("Vehicle inspection is missing, invalid, or expired.");
  if (vehicle.insuranceStatus !== "active" || !hasCurrentExpiration(vehicle.insuranceExpiresAt)) throw new Error("Vehicle insurance is missing, invalid, or expired.");
  if (!vehicle.taxiPlate || !vehicle.medallionNumber) throw new Error("Vehicle taxi plate or medallion is missing.");
  if (vehicle.capacity < params.booking.passengers) throw new Error("Vehicle passenger capacity is too small for this trip.");
  if (vehicle.luggageCapacity < params.booking.luggage) throw new Error("Vehicle luggage capacity is too small for this trip.");

  return { driver, vehicle, association };
}
