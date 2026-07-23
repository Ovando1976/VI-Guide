import type { IslandCode } from "@/types/usvi";

export type ComplianceStatus = "pending" | "active" | "suspended" | "expired" | "revoked";

export type TaxiAssociation = {
  id: string;
  name: string;
  islands: IslandCode[];
  status: ComplianceStatus;
  dispatchPhone?: string;
  dispatchEmail?: string;
  commissionRegistrationId?: string;
  updatedAt?: string;
};

export type FleetVehicle = {
  id: string;
  associationId: string;
  driverId?: string | null;
  islands: IslandCode[];
  active: boolean;
  passengerCapacity: number;
  luggageCapacity: number;
  accessible?: boolean;
  taxiPlate?: string;
  medallionNumber?: string;
  inspectionStatus: ComplianceStatus;
  inspectionExpiresAt?: string | null;
  insuranceStatus: ComplianceStatus;
  insuranceExpiresAt?: string | null;
  make?: string;
  model?: string;
  color?: string;
};

export type OfficialTaxiRateRule = {
  id: string;
  originEstateGeoids?: string[];
  destinationEstateGeoids?: string[];
  originNames: string[];
  destinationNames: string[];
  onePassengerFare: number;
  additionalPassengerFare?: number;
  perPersonFare?: number;
  luggageFarePerPiece?: number;
  luggageIncluded?: number;
  notes?: string;
};

export type OfficialTaxiTariff = {
  id: string;
  title: string;
  version: string;
  island: IslandCode;
  status: "draft" | "active" | "retired";
  effectiveAt: string;
  sourceUrl: string;
  issuingAuthority: "Virgin Islands Taxicab Commission";
  currency: "USD";
  rules: OfficialTaxiRateRule[];
  reviewReference?: string;
  reviewedBy?: string;
  activationStatus?: "unverified" | "verified";
  activatedAt?: string | { seconds?: number; nanoseconds?: number };
  activatedBy?: string;
  activationReviewReference?: string;
  retiredAt?: string | { seconds?: number; nanoseconds?: number };
  retiredBy?: string;
  retirementReason?: string;
  supersededByTariffId?: string;
  createdAt?: string | { seconds?: number; nanoseconds?: number };
  updatedAt?: string | { seconds?: number; nanoseconds?: number };
};
