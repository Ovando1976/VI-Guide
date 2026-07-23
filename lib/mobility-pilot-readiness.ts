import "server-only";

import type { DocumentData } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { assertVerifiedActiveTariff } from "@/lib/taxi-tariff-governance";
import type { DriverProfile, VehicleRecord } from "@/types/driver";
import type {
  MobilityPilotControl,
  MobilityPilotGateReport,
} from "@/types/mobility-pilot";
import type {
  OfficialTaxiTariff,
  TaxiAssociation,
} from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

export const MOBILITY_PILOT_ISLANDS: IslandCode[] = ["stt", "stj", "stx"];

export class MobilityPilotUnavailableError extends Error {
  status = 503;
  code = "MOBILITY_PILOT_NOT_ACTIVE";

  constructor(message: string) {
    super(message);
    this.name = "MobilityPilotUnavailableError";
  }
}

type FleetVehicle = VehicleRecord & { islands?: IslandCode[] };

function hasCurrentExpiration(value?: string | null) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function includesIsland(values: unknown, island: IslandCode) {
  return Array.isArray(values) && values.includes(island);
}

function serializeDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      return candidate.toDate().toISOString();
    }
  }
  if (typeof value === "object" && value && "seconds" in value) {
    const candidate = value as { seconds?: number };
    if (typeof candidate.seconds === "number") {
      return new Date(candidate.seconds * 1000).toISOString();
    }
  }
  return undefined;
}

function summarizeIssues(report: MobilityPilotGateReport) {
  return [report.tariff.issue, report.association.issue, report.fleet.issue]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

export async function buildMobilityPilotGateReport(
  island: IslandCode,
): Promise<MobilityPilotGateReport> {
  if (!MOBILITY_PILOT_ISLANDS.includes(island)) {
    throw new Error("Mobility pilot island is invalid.");
  }

  const db = getAdminDb();
  const [tariffSnapshot, associationSnapshot, driverSnapshot, vehicleSnapshot] =
    await Promise.all([
      db
        .collection("taxiTariffs")
        .where("island", "==", island)
        .where("status", "==", "active")
        .limit(2)
        .get(),
      db.collection("taxiAssociations").get(),
      db.collection("drivers").get(),
      db.collection("vehicles").get(),
    ]);

  let tariff: MobilityPilotGateReport["tariff"];
  if (tariffSnapshot.empty) {
    tariff = {
      ready: false,
      issue: "No verified active tariff is configured for this island.",
    };
  } else if (tariffSnapshot.size !== 1) {
    tariff = {
      ready: false,
      issue: "Exactly one active tariff is required for this island.",
    };
  } else {
    try {
      const document = tariffSnapshot.docs[0];
      const verified = assertVerifiedActiveTariff({
        id: document.id,
        ...document.data(),
      } as OfficialTaxiTariff);
      tariff = {
        ready: true,
        tariffId: verified.id,
        version: verified.version,
      };
    } catch (error) {
      tariff = {
        ready: false,
        issue:
          error instanceof Error
            ? error.message
            : "The active tariff is not governance verified.",
      };
    }
  }

  const associations = associationSnapshot.docs
    .map(
      (document) =>
        ({ id: document.id, ...document.data() }) as TaxiAssociation,
    )
    .filter(
      (association) =>
        association.status === "active" &&
        includesIsland(association.islands, island),
    );
  const associationIds = new Set(associations.map((item) => item.id));
  const association: MobilityPilotGateReport["association"] = associations.length
    ? { ready: true, associationIds: Array.from(associationIds) }
    : {
        ready: false,
        associationIds: [],
        issue: "No active reviewed taxi association covers this island.",
      };

  const vehicles = new Map<string, FleetVehicle>();
  for (const document of vehicleSnapshot.docs) {
    vehicles.set(document.id, {
      id: document.id,
      ...document.data(),
    } as FleetVehicle);
  }

  const eligiblePairs: MobilityPilotGateReport["fleet"]["eligiblePairs"] = [];
  for (const document of driverSnapshot.docs) {
    const driver = {
      id: document.id,
      ...document.data(),
    } as DriverProfile;
    if (!driver.verified || driver.authorizationStatus !== "active") continue;
    if (!includesIsland(driver.islands, island)) continue;
    if (!driver.associationId || !associationIds.has(driver.associationId)) continue;
    if (!driver.vehicleId) continue;
    if (
      !driver.taxiCommissionBadgeNumber ||
      !hasCurrentExpiration(driver.taxiCommissionBadgeExpiresAt) ||
      !driver.licenseClass ||
      !hasCurrentExpiration(driver.licenseExpiresAt)
    ) {
      continue;
    }

    const vehicle = vehicles.get(driver.vehicleId);
    if (!vehicle || !vehicle.active) continue;
    if (
      vehicle.driverId !== driver.id ||
      vehicle.associationId !== driver.associationId
    ) {
      continue;
    }
    if (vehicle.islands?.length && !vehicle.islands.includes(island)) continue;
    if (
      vehicle.inspectionStatus !== "active" ||
      !hasCurrentExpiration(vehicle.inspectionExpiresAt) ||
      vehicle.insuranceStatus !== "active" ||
      !hasCurrentExpiration(vehicle.insuranceExpiresAt) ||
      !vehicle.taxiPlate ||
      !vehicle.medallionNumber ||
      vehicle.capacity < 1 ||
      vehicle.luggageCapacity < 0
    ) {
      continue;
    }

    eligiblePairs.push({
      driverId: driver.id,
      vehicleId: vehicle.id,
      associationId: driver.associationId,
    });
  }

  const fleet: MobilityPilotGateReport["fleet"] = eligiblePairs.length
    ? { ready: true, eligiblePairs }
    : {
        ready: false,
        eligiblePairs: [],
        issue:
          "No driver and vehicle pair currently satisfies Commission, license, association, inspection, insurance, and island requirements.",
      };

  return {
    island,
    ready: tariff.ready && association.ready && fleet.ready,
    checkedAt: new Date().toISOString(),
    tariff,
    association,
    fleet,
  };
}

export async function getMobilityPilotControl(
  island: IslandCode,
): Promise<MobilityPilotControl> {
  const snapshot = await getAdminDb()
    .collection("mobilityPilotIslands")
    .doc(island)
    .get();
  if (!snapshot.exists) return { island, status: "inactive" };

  const data = snapshot.data() as DocumentData;
  return {
    island,
    status: data.status === "active" ? "active" : "inactive",
    activatedAt: serializeDate(data.activatedAt),
    activatedBy:
      typeof data.activatedBy === "string" ? data.activatedBy : undefined,
    activationReviewReference:
      typeof data.activationReviewReference === "string"
        ? data.activationReviewReference
        : undefined,
    deactivatedAt: serializeDate(data.deactivatedAt),
    deactivatedBy:
      typeof data.deactivatedBy === "string" ? data.deactivatedBy : undefined,
    deactivationReason:
      typeof data.deactivationReason === "string"
        ? data.deactivationReason
        : undefined,
    deactivationReviewReference:
      typeof data.deactivationReviewReference === "string"
        ? data.deactivationReviewReference
        : undefined,
    gateSnapshot: data.gateSnapshot as MobilityPilotGateReport | undefined,
    updatedAt: serializeDate(data.updatedAt),
  };
}

export async function assertMobilityPilotActive(island: IslandCode) {
  const [control, report] = await Promise.all([
    getMobilityPilotControl(island),
    buildMobilityPilotGateReport(island),
  ]);

  if (
    control.status !== "active" ||
    !control.activatedAt ||
    !control.activatedBy ||
    !control.activationReviewReference
  ) {
    throw new MobilityPilotUnavailableError(
      "Ride booking is not yet activated for this island. The controlled pilot must be approved by an administrator.",
    );
  }
  if (!report.ready) {
    throw new MobilityPilotUnavailableError(
      `Ride booking has been paused because a live pilot requirement is no longer satisfied. ${summarizeIssues(report)}`,
    );
  }
  if (
    !control.gateSnapshot?.tariff.tariffId ||
    control.gateSnapshot.tariff.tariffId !== report.tariff.tariffId
  ) {
    throw new MobilityPilotUnavailableError(
      "The official tariff changed after pilot approval. An administrator must review and reactivate this island.",
    );
  }

  return { control, report };
}
