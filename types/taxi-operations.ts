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
  passengerFareBands?: Array<{
    minimumPassengers: number;
    maximumPassengers?: number;
    calculation: "flat_party" | "per_person";
    amount: number;
  }>;
  notes?: string;
};

export type OfficialTaxiTariffSource = {
  url: string;
  label: string;
  publisher: string;
  sourceType: "commission_schedule" | "government_record" | "statute" | "verified_transcription";
  retrievedAt: string;
  sha256?: string;
};

export type OfficialTaxiTariff = {
  id: string;
  title: string;
  version: string;
  island: IslandCode;
  status: "draft" | "provisional" | "active" | "retired";
  effectiveAt: string;
  sourceUrl: string;
  sources?: OfficialTaxiTariffSource[];
  issuingAuthority: "Virgin Islands Taxicab Commission";
  currency: "USD";
  approvedAt?: string;
  approvedBy?: string;
  verificationNotes?: string;
  rules: OfficialTaxiRateRule[];
};
