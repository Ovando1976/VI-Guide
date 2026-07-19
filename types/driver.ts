export type DriverAvailability = "offline" | "available" | "busy";

export type VehicleType =
  | "sedan"
  | "suv"
  | "van"
  | "safari"
  | "luxury";

export type DriverProfile = {
  id: string;
  fullName: string;
  islands: ("stt" | "stj" | "stx")[];
  phone?: string;
  verified: boolean;
  associationId?: string;
  authorizationStatus?: "pending" | "active" | "suspended" | "expired" | "revoked";
  taxiCommissionBadgeNumber?: string;
  taxiCommissionBadgeExpiresAt?: string | null;
  licenseClass?: string;
  licenseExpiresAt?: string | null;
  airportCertified: boolean;
  ferryCertified: boolean;
  availability: DriverAvailability;
  rating: number;
  completedTrips: number;
  reliabilityScore: number;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
};

export type VehicleRecord = {
  id: string;
  driverId: string;
  associationId?: string;
  type: VehicleType;
  make: string;
  model: string;
  color?: string;
  plate?: string;
  taxiPlate?: string;
  medallionNumber?: string;
  inspectionStatus?: "pending" | "active" | "suspended" | "expired" | "revoked";
  inspectionExpiresAt?: string | null;
  insuranceStatus?: "pending" | "active" | "suspended" | "expired" | "revoked";
  insuranceExpiresAt?: string | null;
  capacity: number;
  luggageCapacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
