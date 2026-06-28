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

export type BusinessJobStatus =
  | "lead"
  | "estimating"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BusinessJobPriority = "low" | "normal" | "high" | "urgent";

export type BusinessJob = {
  id: string;
  businessId: string;
  customerId?: string;
  leadId?: string;
  estimateId?: string;
  invoiceId?: string;
  title: string;
  description?: string;
  location?: string;
  status: BusinessJobStatus;
  priority: BusinessJobPriority;
  projectedValue: number;
  actualValue: number;
  startAt?: number;
  endAt?: number;
  createdAt: number;
  updatedAt: number;
};

const now = () => Date.now();

function withId<T>(id: string, data: T): T & { id: string } {
  return { ...data, id };
}

export async function getBusinessJobsForBusinessIds(
  businessIds: string[],
): Promise<BusinessJob[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessJob[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessJobs"),
        where("businessId", "==", businessId),
        orderBy("updatedAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessJob, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessJob(input: {
  businessId: string;
  customerId?: string;
  leadId?: string;
  estimateId?: string;
  invoiceId?: string;
  title: string;
  description?: string;
  location?: string;
  status?: BusinessJobStatus;
  priority?: BusinessJobPriority;
  projectedValue?: number;
  actualValue?: number;
  startAt?: number;
  endAt?: number;
}) {
  const timestamp = now();

  const ref = await addDoc(collection(db, "businessJobs"), {
    businessId: input.businessId,
    customerId: input.customerId || "",
    leadId: input.leadId || "",
    estimateId: input.estimateId || "",
    invoiceId: input.invoiceId || "",
    title: input.title,
    description: input.description || "",
    location: input.location || "",
    status: input.status || "lead",
    priority: input.priority || "normal",
    projectedValue: input.projectedValue || 0,
    actualValue: input.actualValue || 0,
    startAt: input.startAt || null,
    endAt: input.endAt || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessJobStatus(
  jobId: string,
  status: BusinessJobStatus,
) {
  await updateDoc(doc(db, "businessJobs", jobId), {
    status,
    updatedAt: now(),
  });
}

export async function updateBusinessJobValue(
  jobId: string,
  input: {
    projectedValue?: number;
    actualValue?: number;
  },
) {
  await updateDoc(doc(db, "businessJobs", jobId), {
    ...input,
    updatedAt: now(),
  });
}

export async function updateBusinessJobSchedule(
  jobId: string,
  input: {
    startAt?: number;
    endAt?: number;
    location?: string;
  },
) {
  await updateDoc(doc(db, "businessJobs", jobId), {
    ...input,
    updatedAt: now(),
  });
}

export async function attachEstimateToJob(
  jobId: string,
  estimateId: string,
) {
  await updateDoc(doc(db, "businessJobs", jobId), {
    estimateId,
    status: "estimating",
    updatedAt: now(),
  });
}

export async function attachInvoiceToJob(
  jobId: string,
  invoiceId: string,
) {
  await updateDoc(doc(db, "businessJobs", jobId), {
    invoiceId,
    updatedAt: now(),
  });
}

export async function createJobFromLead(input: {
  businessId: string;
  leadId: string;
  customerId?: string;
  title: string;
  description?: string;
  location?: string;
  projectedValue?: number;
}) {
  return createBusinessJob({
    businessId: input.businessId,
    leadId: input.leadId,
    customerId: input.customerId,
    title: input.title,
    description: input.description,
    location: input.location,
    projectedValue: input.projectedValue || 0,
    status: "lead",
    priority: "normal",
  });
}