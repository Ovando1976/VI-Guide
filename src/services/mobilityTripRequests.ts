import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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

export async function saveMobilityTripRequest(
  draft: MobilityTripRequestDraftPayload
): Promise<SaveMobilityTripRequestResult> {
  const db = getMobilityFirestore();
  const requestedAt = new Date().toISOString();

  const request: FirebaseMobilityTripRequest = {
    ...draft,
    draftId: draft.id,
    status: "requested",
    requestedAt,
    updatedAt: requestedAt,
    firestoreSchemaVersion: 1,
    firebaseSource: "mobility_page",
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "mobilityTripRequests"), request);

  return {
    firestoreId: docRef.id,
    path: `mobilityTripRequests/${docRef.id}`,
    requestedAt,
  };
}

export type SavedMobilityTripRequest = {
  firestoreId: string;
  path: string;
  id?: string;
  draftId?: string;
  status?: string;
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
};

function normalizeMobilityTripRequest(
  snapshot: QueryDocumentSnapshot
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
    limit(limitCount)
  );

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      args.onData(snapshot.docs.map(normalizeMobilityTripRequest));
    },
    (error) => {
      args.onError?.(error);
    }
  );
}

