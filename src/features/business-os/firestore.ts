import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

export type BusinessTaskStatus = "open" | "done" | "cancelled";
export type BusinessTaskPriority = "low" | "normal" | "high" | "urgent";

export type BusinessAppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled";

export type BusinessTimelineType =
  | "lead"
  | "call"
  | "email"
  | "appointment"
  | "task"
  | "estimate"
  | "invoice"
  | "payment"
  | "note";

export type BusinessNotificationType =
  | "lead"
  | "task"
  | "appointment"
  | "revenue"
  | "listing"
  | "system";

export type BusinessTask = {
  id: string;
  businessId: string;
  leadId?: string;
  title: string;
  notes?: string;
  status: BusinessTaskStatus;
  priority: BusinessTaskPriority;
  dueAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type BusinessAppointment = {
  id: string;
  businessId: string;
  leadId?: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string;
  notes?: string;
  status: BusinessAppointmentStatus;
  startAt: number;
  endAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type BusinessTimelineEvent = {
  id: string;
  businessId: string;
  leadId?: string;
  type: BusinessTimelineType;
  title: string;
  description?: string;
  source?: string;
  createdAt: number;
};

export type BusinessNotification = {
  id: string;
  businessId: string;
  type: BusinessNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
};

const now = () => Date.now();

function withId<T>(id: string, data: T): T & { id: string } {
  return { ...data, id };
}

export async function getBusinessTasksForBusinessIds(
  businessIds: string[],
): Promise<BusinessTask[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessTask[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessTasks"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessTask, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessTask(input: {
  businessId: string;
  leadId?: string;
  title: string;
  notes?: string;
  priority?: BusinessTaskPriority;
  dueAt?: number;
}) {
  const timestamp = now();

  const ref = await addDoc(collection(db, "businessTasks"), {
    businessId: input.businessId,
    leadId: input.leadId,
    title: input.title,
    notes: input.notes || "",
    status: "open",
    priority: input.priority || "normal",
    dueAt: input.dueAt || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessTaskStatus(
  taskId: string,
  status: BusinessTaskStatus,
) {
  await updateDoc(doc(db, "businessTasks", taskId), {
    status,
    updatedAt: now(),
  });
}

export async function getBusinessAppointmentsForBusinessIds(
  businessIds: string[],
): Promise<BusinessAppointment[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessAppointment[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessAppointments"),
        where("businessId", "==", businessId),
        orderBy("startAt", "asc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessAppointment, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessAppointment(input: {
  businessId: string;
  leadId?: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string;
  notes?: string;
  startAt: number;
  endAt?: number;
}) {
  const timestamp = now();

  const ref = await addDoc(collection(db, "businessAppointments"), {
    businessId: input.businessId,
    leadId: input.leadId,
    title: input.title,
    customerName: input.customerName || "",
    customerEmail: input.customerEmail || "",
    customerPhone: input.customerPhone || "",
    location: input.location || "",
    notes: input.notes || "",
    status: "scheduled",
    startAt: input.startAt,
    endAt: input.endAt || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessAppointmentStatus(
  appointmentId: string,
  status: BusinessAppointmentStatus,
) {
  await updateDoc(doc(db, "businessAppointments", appointmentId), {
    status,
    updatedAt: now(),
  });
}

export async function getBusinessTimelineForBusinessIds(
  businessIds: string[],
): Promise<BusinessTimelineEvent[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessTimelineEvent[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessTimeline"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessTimelineEvent, "id">),
      ),
    );
  }

  return rows;
}


export async function getBusinessNotificationsForBusinessIds(
  businessIds: string[],
): Promise<BusinessNotification[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessNotification[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessNotifications"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessNotification, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessNotification(input: {
  businessId: string;
  type: BusinessNotificationType;
  title: string;
  message: string;
}) {
  const ref = await addDoc(collection(db, "businessNotifications"), {
    businessId: input.businessId,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    createdAt: now(),
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function markBusinessNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "businessNotifications", notificationId), {
    read: true,
  });
}

export async function createBusinessTimelineEvent(input: {
  businessId: string;
  type: string;
  source: string;
  title: string;
  description?: string;
  jobId?: string;
  leadId?: string;
  customerId?: string;
}) {
  await addDoc(collection(db, "businessTimeline"), {
    businessId: input.businessId,
    type: input.type,
    source: input.source,
    title: input.title,
    description: input.description ?? "",
    jobId: input.jobId ?? "",
    leadId: input.leadId ?? "",
    customerId: input.customerId ?? "",
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
}