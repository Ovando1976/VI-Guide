import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";
import type {
  MobilityDispatchEventDoc,
  MobilityDispatchEventInput,
  MobilityRequestDoc,
  MobilityRequestInput,
} from "../../types/businessDemo";
import type { DemoMobilityRequestStatus } from "../mobility/demoMobilityStore";

const REQUESTS_COLLECTION = "mobilityRequests";
const EVENTS_COLLECTION = "mobilityDispatchEvents";

function now() {
  return Date.now();
}

export async function createFirestoreMobilityRequest(
  input: MobilityRequestInput
): Promise<MobilityRequestDoc> {
  const timestamp = now();

  const payload = {
    ...input,
    status: "new" as DemoMobilityRequestStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const ref = await addDoc(collection(db, REQUESTS_COLLECTION), payload);

  await createMobilityDispatchEvent({
    requestId: ref.id,
    nextStatus: "new",
    note: "Mobility request created.",
    actorName: "Visitor",
  });

  return {
    id: ref.id,
    ...payload,
  };
}

export async function updateFirestoreMobilityRequestStatus(
  requestId: string,
  nextStatus: DemoMobilityRequestStatus,
  previousStatus?: DemoMobilityRequestStatus
) {
  await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    status: nextStatus,
    updatedAt: now(),
  });

  await createMobilityDispatchEvent({
    requestId,
    previousStatus,
    nextStatus,
    note: `Status changed to ${nextStatus}.`,
    actorName: "Dispatcher",
  });
}

export async function createMobilityDispatchEvent(
  input: MobilityDispatchEventInput
): Promise<MobilityDispatchEventDoc> {
  const payload = {
    ...input,
    createdAt: now(),
  };

  const ref = await addDoc(collection(db, EVENTS_COLLECTION), payload);

  return {
    id: ref.id,
    ...payload,
  };
}

export function subscribeToFirestoreMobilityRequests(
  callback: (requests: MobilityRequestDoc[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((request) => ({
          id: request.id,
          ...(request.data() as Omit<MobilityRequestDoc, "id">),
        }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
