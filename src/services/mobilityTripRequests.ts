import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type FieldValue,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import firebaseConfigJson from "../../firebase-applet-config.json";
import type { MobilityIslandCode } from "../types/mobility";

const firebaseConfig = firebaseConfigJson as FirebaseOptions & {
  firestoreDatabaseId?: string;
};

export const MOBILITY_LAST_REQUEST_STORAGE_KEY =
  "viGuide.lastMobilityTripRequest";

export type MobilityTripDispatchStatus =
  | "requested"
  | "accepted"
  | "driver_arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MobilityAssignedDriver = {
  driverId: string;
  driverName: string;
  vehicleId?: string;
  vehicleLabel?: string;
};

export type MobilityTripRequestLineItem = {
  label: string;
  amountCents: number;
  detail?: string;
};

export type MobilityTripRequestDraftPayload = {
  id: string;
  status: "draft";
  createdAt: string;
  pickupPlaceId: string;
  dropoffPlaceId: string;
  pickupName: string;
  dropoffName: string;
  pickupIsland: MobilityIslandCode;
  dropoffIsland: MobilityIslandCode;
  passengers: number;
  luggage: number;
  serviceClass: "shared" | "private";
  totalFareCents: number;
  taxiFareCents: number;
  ferryFareCents: number;
  connectorLabel: string;
  routeDescription: string;
  sourceLabel: string;
  confidence: "high" | "medium" | "low";
  lineItems: MobilityTripRequestLineItem[];
  notes: string[];
};

export type FirebaseMobilityTripRequest = Omit<
  MobilityTripRequestDraftPayload,
  "status"
> & {
  status: "requested";
  dispatchStatus: "requested";
  draftId: string;
  requestedAt: string;
  updatedAt: string;
  firestoreSchemaVersion: 1;
  firebaseSource: "mobility_page";
  createdAtServer: FieldValue;
  updatedAtServer: FieldValue;
};

export type SaveMobilityTripRequestResult = {
  firestoreId: string;
  path: string;
  requestedAt: string;
};

function getMobilityFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getMobilityFirestore() {
  const app = getMobilityFirebaseApp();
  const databaseId = firebaseConfig.firestoreDatabaseId;

  if (databaseId && databaseId !== "(default)") {
    return getFirestore(app, databaseId);
  }

  return getFirestore(app);
}

function rememberLastMobilityTripRequest(result: SaveMobilityTripRequestResult) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      MOBILITY_LAST_REQUEST_STORAGE_KEY,
      JSON.stringify(result),
    );
  } catch {
    // Ignore storage failures. Firestore still saved the request.
  }
}

export async function saveMobilityTripRequest(
  draft: MobilityTripRequestDraftPayload,
): Promise<SaveMobilityTripRequestResult> {
  const db = getMobilityFirestore();
  const requestedAt = new Date().toISOString();

  const request: FirebaseMobilityTripRequest = {
    ...draft,
    draftId: draft.id,
    status: "requested",
    dispatchStatus: "requested",
    requestedAt,
    updatedAt: requestedAt,
    firestoreSchemaVersion: 1,
    firebaseSource: "mobility_page",
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "mobilityTripRequests"), request);

  const result = {
    firestoreId: docRef.id,
    path: `mobilityTripRequests/${docRef.id}`,
    requestedAt,
  };

  rememberLastMobilityTripRequest(result);

  return result;
}

export type SavedMobilityTripRequest = {
  firestoreId: string;
  path: string;
  id?: string;
  draftId?: string;
  status?: MobilityTripDispatchStatus | string;
  dispatchStatus?: MobilityTripDispatchStatus | string;
  createdAt?: string;
  requestedAt?: string;
  updatedAt?: string;
  pickupPlaceId?: string;
  dropoffPlaceId?: string;
  pickupName?: string;
  dropoffName?: string;
  pickupIsland?: MobilityIslandCode;
  dropoffIsland?: MobilityIslandCode;
  passengers?: number;
  luggage?: number;
  serviceClass?: "shared" | "private";
  totalFareCents?: number;
  taxiFareCents?: number;
  ferryFareCents?: number;
  connectorLabel?: string;
  routeDescription?: string;
  sourceLabel?: string;
  confidence?: "high" | "medium" | "low";
  lineItems?: MobilityTripRequestLineItem[];
  notes?: string[];

  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVehicleId?: string;
  assignedVehicleLabel?: string;
  assignedAt?: string;
};

function normalizeMobilityTripRequest(
  snapshot: QueryDocumentSnapshot,
): SavedMobilityTripRequest {
  const data = snapshot.data() as Record<string, unknown>;

  return {
    ...data,
    firestoreId: snapshot.id,
    path: snapshot.ref.path,
  } as SavedMobilityTripRequest;
}

export function subscribeRecentMobilityTripRequests(args: {
  limitCount?: number;
  onData: (requests: SavedMobilityTripRequest[]) => void;
  onError?: (error: FirestoreError) => void;
}): Unsubscribe {
  const db = getMobilityFirestore();
  const limitCount = Math.min(Math.max(args.limitCount ?? 25, 1), 100);

  const requestsQuery = query(
    collection(db, "mobilityTripRequests"),
    orderBy("requestedAt", "desc"),
    limit(limitCount),
  );

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      args.onData(snapshot.docs.map(normalizeMobilityTripRequest));
    },
    (error) => {
      args.onError?.(error);
    },
  );
}

export async function updateMobilityTripRequestStatus(args: {
  firestoreId: string;
  status: MobilityTripDispatchStatus;
}) {
  const db = getMobilityFirestore();
  const updatedAt = new Date().toISOString();

  const requestRef = doc(db, "mobilityTripRequests", args.firestoreId);

  await updateDoc(requestRef, {
    status: args.status,
    dispatchStatus: args.status,
    updatedAt,
    updatedAtServer: serverTimestamp(),
  });

  return {
    firestoreId: args.firestoreId,
    status: args.status,
    updatedAt,
  };
}

export async function assignMobilityTripRequestDriver(args: {
  firestoreId: string;
  driver: MobilityAssignedDriver;
}) {
  const db = getMobilityFirestore();
  const updatedAt = new Date().toISOString();

  const requestRef = doc(db, "mobilityTripRequests", args.firestoreId);

  await updateDoc(requestRef, {
    status: "accepted",
    dispatchStatus: "accepted",
    assignedDriverId: args.driver.driverId,
    assignedDriverName: args.driver.driverName,
    assignedVehicleId: args.driver.vehicleId ?? "",
    assignedVehicleLabel: args.driver.vehicleLabel ?? "",
    assignedAt: updatedAt,
    updatedAt,
    updatedAtServer: serverTimestamp(),
  });

  return {
    firestoreId: args.firestoreId,
    status: "accepted" as const,
    assignedDriverId: args.driver.driverId,
    assignedDriverName: args.driver.driverName,
    updatedAt,
  };
}

export async function clearMobilityTripRequestDriver(args: {
  firestoreId: string;
}) {
  const db = getMobilityFirestore();
  const updatedAt = new Date().toISOString();

  const requestRef = doc(db, "mobilityTripRequests", args.firestoreId);

  await updateDoc(requestRef, {
    status: "requested",
    dispatchStatus: "requested",
    assignedDriverId: "",
    assignedDriverName: "",
    assignedVehicleId: "",
    assignedVehicleLabel: "",
    assignedAt: "",
    updatedAt,
    updatedAtServer: serverTimestamp(),
  });

  return {
    firestoreId: args.firestoreId,
    status: "requested" as const,
    updatedAt,
  };
}


export function subscribeMobilityTripRequestById(args: {
  firestoreId: string;
  onData: (request: SavedMobilityTripRequest | null) => void;
  onError?: (error: FirestoreError) => void;
}): Unsubscribe {
  const db = getMobilityFirestore();
  const requestRef = doc(db, "mobilityTripRequests", args.firestoreId);

  return onSnapshot(
    requestRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        args.onData(null);
        return;
      }

      const data = snapshot.data() as Record<string, unknown>;

      args.onData({
        ...data,
        firestoreId: snapshot.id,
        path: snapshot.ref.path,
      } as SavedMobilityTripRequest);
    },
    (error) => {
      args.onError?.(error);
    },
  );
}

export function readLastMobilityTripRequest():
  | SaveMobilityTripRequestResult
  | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(
      MOBILITY_LAST_REQUEST_STORAGE_KEY,
    );

    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<SaveMobilityTripRequestResult>;

    if (!parsed.firestoreId || !parsed.path || !parsed.requestedAt) {
      return null;
    }

    return {
      firestoreId: parsed.firestoreId,
      path: parsed.path,
      requestedAt: parsed.requestedAt,
    };
  } catch {
    return null;
  }
}

export function clearLastMobilityTripRequest() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(MOBILITY_LAST_REQUEST_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
