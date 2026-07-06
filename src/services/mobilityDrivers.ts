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



export function mobilityDriverStatusRank(driver: Pick<MobilityDriverProfile, "active" | "status">) {
  if (!driver.active) return 99;
  if (driver.status === "available") return 0;
  if (driver.status === "busy") return 1;
  if (driver.status === "offline") return 2;
  return 50;
}

export function isMobilityDriverAssignable(
  driver: Pick<MobilityDriverProfile, "active" | "status">,
) {
  return driver.active && driver.status === "available";
}

export function formatMobilityDriverLabel(driver: MobilityDriverProfile) {
  const statusLabel =
    !driver.active
      ? "DISABLED"
      : driver.status === "available"
        ? ""
        : driver.status.toUpperCase();

  return [
    `${driver.driverName || driver.name} — ${driver.vehicleLabel}`,
    statusLabel,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sortDrivers(drivers: MobilityDriverProfile[]) {
  return [...drivers].sort((a, b) => {
    const statusDelta = mobilityDriverStatusRank(a) - mobilityDriverStatusRank(b);
    if (statusDelta !== 0) return statusDelta;

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


export type MobilityDriverProfileInput = {
  driverId?: string;
  driverName: string;
  island: MobilityDriverIsland;
  vehicleId?: string;
  vehicleLabel: string;
  phone?: string;
  status?: MobilityDriverStatus;
  active?: boolean;
  sortOrder?: number;
};

function makeDriverId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildDriverId(input: MobilityDriverProfileInput) {
  const explicitId = cleanString(input.driverId);

  if (explicitId) {
    return makeDriverId(explicitId);
  }

  const islandPrefix =
    input.island === "st_thomas"
      ? "stt"
      : input.island === "st_john"
        ? "stj"
        : input.island === "st_croix"
          ? "stx"
          : input.island === "water_island"
            ? "wat"
            : "territory";

  return makeDriverId(`${islandPrefix}-${input.driverName}-${input.vehicleLabel}`);
}

export function subscribeMobilityDrivers(args: {
  onData: (drivers: MobilityDriverProfile[]) => void;
  onError?: (error: unknown) => void;
}) {
  return onSnapshot(
    collection(db, MOBILITY_DRIVERS_COLLECTION),
    (snapshot) => {
      const drivers = sortDrivers(
        snapshot.docs.map((driverDoc) =>
          normalizeDriverProfile(driverDoc.id, driverDoc.data()),
        ),
      );

      if (!drivers.length) {
        args.onData(DEFAULT_MOBILITY_DRIVER_PROFILES);

        if (!attemptedDefaultSeed) {
          attemptedDefaultSeed = true;
          ensureDefaultMobilityDrivers().catch(() => {
            // Fallback drivers keep the UI working if seeding is blocked.
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

export async function saveMobilityDriverProfile(
  input: MobilityDriverProfileInput,
) {
  const now = new Date().toISOString();
  const driverId = buildDriverId(input);

  const driver: MobilityDriverProfile = {
    id: driverId,
    driverId,
    name: input.driverName.trim(),
    driverName: input.driverName.trim(),
    island: input.island,
    vehicleId: cleanString(input.vehicleId, `${driverId}-vehicle`),
    vehicleLabel: input.vehicleLabel.trim(),
    phone: cleanString(input.phone),
    status: input.status || "available",
    active: input.active !== false,
    sortOrder:
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
        ? input.sortOrder
        : 999,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, MOBILITY_DRIVERS_COLLECTION, driverId), driver, {
    merge: true,
  });

  return driver;
}

export async function updateMobilityDriverProfile(
  driverId: string,
  updates: Partial<MobilityDriverProfileInput>,
) {
  const cleanDriverId = makeDriverId(driverId);

  await setDoc(
    doc(db, MOBILITY_DRIVERS_COLLECTION, cleanDriverId),
    {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
