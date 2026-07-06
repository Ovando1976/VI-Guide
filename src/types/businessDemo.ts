import type { IslandCode } from "../types";
import type {
  DemoMobilityIsland,
  DemoMobilityRequestStatus,
  DemoMobilityServiceType,
} from "../lib/mobility/demoMobilityStore";

export type FirestoreWriteState = "idle" | "saving" | "saved" | "error";

export type PartnerClaimStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "approved"
  | "rejected";

export type PartnerClaimInput = {
  partnerId: string;
  partnerName: string;
  partnerTier?: string;
  islandCode?: IslandCode;
  area?: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  message: string;
  source: "partner_page" | "demo_hub" | "merchant_dashboard";
};

export type PartnerClaimDoc = PartnerClaimInput & {
  id: string;
  status: PartnerClaimStatus;
  createdAt: number;
  updatedAt: number;
};

export type MerchantLeadAction =
  | "profile_view"
  | "call"
  | "directions"
  | "save"
  | "request_info"
  | "concierge"
  | "claim_business";

export type MerchantLeadInput = {
  partnerId: string;
  partnerName: string;
  action: MerchantLeadAction;
  message: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  source: "partner_page" | "claim_modal" | "concierge" | "demo";
};

export type MerchantLeadDoc = MerchantLeadInput & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

export type MobilityRequestInput = {
  island: DemoMobilityIsland;
  serviceType: DemoMobilityServiceType;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  passengers: number;
  luggage: number;
  visitorName: string;
  visitorPhone: string;
  notes: string;
  estimatedFare: number;
  source: "mobility_page" | "demo";
};

export type MobilityRequestDoc = MobilityRequestInput & {
  id: string;
  status: DemoMobilityRequestStatus;
  createdAt: number;
  updatedAt: number;
};

export type MobilityDispatchEventInput = {
  requestId: string;
  previousStatus?: DemoMobilityRequestStatus;
  nextStatus: DemoMobilityRequestStatus;
  note?: string;
  actorName?: string;
};

export type MobilityDispatchEventDoc = MobilityDispatchEventInput & {
  id: string;
  createdAt: number;
};
