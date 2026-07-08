import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

import { db } from "../../firebase";
import type { MobilityRequestStatus } from "../mobility/mobilityOs";

const MOBILITY_REQUESTS = "mobilityRequests";
const MOBILITY_EVENTS = "mobilityDispatchEvents";

export async function assignMobilityDriver({
  requestId,
  assignedDriverId,
  assignedDriverName,
  assignedDriverPhone,
  assignedVehicle,
  dispatcherNotes,
  status,
}: {
  requestId: string;
  assignedDriverId?: string;
  assignedDriverName: string;
  assignedDriverPhone: string;
  assignedVehicle: string;
  dispatcherNotes?: string;
  status?: MobilityRequestStatus;
}) {
  const now = Date.now();

  const patch: Record<string, unknown> = {
    assignedDriverId: assignedDriverId || "",
    assignedDriverName,
    assignedDriverPhone,
    assignedVehicle,
    dispatcherNotes: dispatcherNotes || "",
    updatedAt: now,
  };

  if (status) patch.status = status;

  await updateDoc(doc(db, MOBILITY_REQUESTS, requestId), patch);

  await addDoc(collection(db, MOBILITY_EVENTS), {
    requestId,
    eventType: "driver_assigned",
    assignedDriverId: assignedDriverId || "",
    assignedDriverName,
    assignedDriverPhone,
    assignedVehicle,
    dispatcherNotes: dispatcherNotes || "",
    status: status || "",
    createdAt: now,
  });
}

export async function updateMobilityDispatchNotes({
  requestId,
  dispatcherNotes,
}: {
  requestId: string;
  dispatcherNotes: string;
}) {
  const now = Date.now();

  await updateDoc(doc(db, MOBILITY_REQUESTS, requestId), {
    dispatcherNotes,
    updatedAt: now,
  });

  await addDoc(collection(db, MOBILITY_EVENTS), {
    requestId,
    eventType: "dispatcher_note",
    dispatcherNotes,
    createdAt: now,
  });
}
