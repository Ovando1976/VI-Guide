import type { IslandCode } from "@/types/usvi";

export type MobilityPilotStatus = "inactive" | "active";

export type MobilityPilotGateReport = {
  island: IslandCode;
  ready: boolean;
  checkedAt: string;
  tariff: {
    ready: boolean;
    tariffId?: string;
    version?: string;
    issue?: string;
  };
  association: {
    ready: boolean;
    associationIds: string[];
    issue?: string;
  };
  fleet: {
    ready: boolean;
    eligiblePairs: Array<{
      driverId: string;
      vehicleId: string;
      associationId: string;
    }>;
    issue?: string;
  };
};

export type MobilityPilotControl = {
  island: IslandCode;
  status: MobilityPilotStatus;
  activatedAt?: string;
  activatedBy?: string;
  activationReviewReference?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
  deactivationReviewReference?: string;
  gateSnapshot?: MobilityPilotGateReport;
  updatedAt?: string;
};
