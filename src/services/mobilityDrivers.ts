import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import firebaseConfigJson from "../../firebase-applet-config.json";

export type MobilityDriverIsland =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island"
  | "territory";

export type MobilityDriverStatus = "available" | "busy" | "offline";

export type MobilityDriverProfile = {
  id: string;
  driverId: string;
  name: string;
  driverName: string;
  island: MobilityDriverIsland;
  vehicleId: string;
  vehicleLabel: string;
  phone?: string;
  status: MobilityDriverStatus;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

const firebaseConfig = firebaseConfigJson as FirebaseOptions & {
  firestoreDatabaseId?: string;
};

const { firestoreDatabaseId, ...firebaseAppConfig } = firebaseConfig;

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseAppConfig);

const db = getFirestore(firebaseApp, firestoreDatabaseId || undefined);

const MOBILITY_DRIVERS_COLLECTION = "mobilityDrivers";

export const DEFAULT_MOBILITY_DRIVER_PROFILES: MobilityDriverProfile[] = [
  {
    id: "stt-driver-1",
    driverId: "stt-driver-1",
    name: "St. Thomas Driver 1",
    driverName: "St. Thomas Driver 1",
    island: "st_thomas",
    vehicleId: "stt-van-1",
    vehicleLabel: "STT Van 1",
    phone: "",
    status: "available",
    active: true,
    sortOrder: 10,
  },
  {
    id: "stt-driver-2",
    driverId: "stt-driver-2",
    name: "St. Thomas Driver 2",
    driverName: "St. Thomas Driver 2",
    island: "st_thomas",
    vehicleId: "stt-van-2",
    vehicleLabel: "STT Van 2",
    phone: "",
    status: "available",
    active: true,
    sortOrder: 20,
  },
  {
    id: "stj-driver-1",
    driverId: "stj-driver-1",
    name: "St. John Driver 1",
    driverName: "St. John Driver 1",
    island: "st_john",
    vehicleId: "stj-jeep-1",
    vehicleLabel: "STJ Jeep 1",
    phone: "",
    status: "available",
    active: true,
    sortOrder: 30,
  },
  {
    id: "stx-driver-1",
    driverId: "stx-driver-1",
    name: "St. Croix Driver 1",
    driverName: "St. Croix Driver 1",
    island: "st_croix",
    vehicleId: "stx-van-1",
    vehicleLabel: "STX Van 1",
    phone: "",
    status: "available",
    active: true,
    sortOrder: 40,
  },
  {
    id: "wat-driver-1",
    driverId: "wat-driver-1",
    name: "Water Island Driver 1",
    driverName: "Water Island Driver 1",
    island: "water_island",
    vehicleId: "wat-cart-1",
    vehicleLabel: "Water Island Cart 1",
    phone: "",
    status: "available",
    active: true,
    sortOrder: 50,
  },
];

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeDriverProfile(
  id: string,
  value: Record<string, unknown>,
): MobilityDriverProfile {
  const driverId = cleanString(value.driverId, id);
  const driverName = cleanString(
    value.driverName,
    cleanString(value.name, "Driver"),
  );

  return {
    id,
    driverId,
    name: driverName,
    driverName,
    island: cleanString(value.island, "st_thomas") as MobilityDriverIsland,
    vehicleId: cleanString(value.vehicleId, `${driverId}-vehicle`),
    vehicleLabel: cleanString(value.vehicleLabel, "Vehicle"),
    phone: cleanString(value.phone),
    status: cleanString(value.status, "available") as MobilityDriverStatus,
    active: value.active !== false,
    sortOrder:
      typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : 999,
    createdAt: cleanString(value.createdAt),
    updatedAt: cleanString(value.updatedAt),
  };
}

function sortDrivers(drivers: MobilityDriverProfile[]) {
  return [...drivers].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

let attemptedDefaultSeed = false;

export async function ensureDefaultMobilityDrivers() {
  const now = new Date().toISOString();

  await Promise.all(
    DEFAULT_MOBILITY_DRIVER_PROFILES.map((driver) =>
      setDoc(
        doc(db, MOBILITY_DRIVERS_COLLECTION, driver.driverId),
        {
          ...driver,
          createdAt: driver.createdAt || now,
          updatedAt: now,
        },
        { merge: true },
      ),
    ),
  );
}

export function subscribeActiveMobilityDrivers(args: {
  onData: (drivers: MobilityDriverProfile[]) => void;
  onError?: (error: unknown) => void;
}) {
  return onSnapshot(
    collection(db, MOBILITY_DRIVERS_COLLECTION),
    (snapshot) => {
      const drivers = sortDrivers(
        snapshot.docs
          .map((driverDoc) =>
            normalizeDriverProfile(driverDoc.id, driverDoc.data()),
          )
          .filter((driver) => driver.active),
      );

      if (!drivers.length) {
        args.onData(DEFAULT_MOBILITY_DRIVER_PROFILES);

        if (!attemptedDefaultSeed) {
          attemptedDefaultSeed = true;
          ensureDefaultMobilityDrivers().catch(() => {
            // Fallback drivers keep the UI working if Firestore seeding is blocked.
          });
        }

        return;
      }

      args.onData(drivers);
    },
    (error) => {
      args.onError?.(error);
      args.onData(DEFAULT_MOBILITY_DRIVER_PROFILES);
    },
  );
}
