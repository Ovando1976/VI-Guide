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

export type TaxiFareConfirmationScope = "all" | "two_or_more";

/**
 * A published passenger tier. `fare` is either the fare for the whole party
 * (`party`) or the per-passenger fare (`per_person`) for a party whose size is
 * within the inclusive min/max bounds. This lets us faithfully model both
 * STT/STJ 1 vs 2+ schedules and STX 1-or-2 vs 3+ schedules without inference.
 */
export type OfficialTaxiPassengerFareTier = {
  minPassengers: number;
  maxPassengers?: number;
  fare: number;
  basis: "party" | "per_person";
};

export type OfficialTaxiRateRule = {
  id: string;
  originEstateGeoids?: string[];
  destinationEstateGeoids?: string[];
  originNames: string[];
  destinationNames: string[];
  originCandidateAliases?: string[];
  destinationCandidateAliases?: string[];
  /** Preferred representation for newly reviewed tariff data. */
  passengerFareTiers?: OfficialTaxiPassengerFareTier[];
  /** Legacy fields retained while existing reviewed tariff documents migrate. */
  onePassengerFare: number;
  additionalPassengerFare?: number;
  perPersonFare?: number;
  luggageFarePerPiece?: number;
  luggageIncluded?: number;
  fareConfirmationRequired?: TaxiFareConfirmationScope;
  fareConfirmationReason?: string;
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
