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
import type { BusinessLead } from "../../types/business";

export type BusinessCustomerStatus =
  | "new"
  | "active"
  | "vip"
  | "inactive"
  | "lost";

export type BusinessCustomer = {
  id: string;
  businessId: string;
  leadId?: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: BusinessCustomerStatus;
  lifetimeValue: number;
  lastContactAt?: number;
  createdAt: number;
  updatedAt: number;
};

const now = () => Date.now();

function withId<T>(id: string, data: T): T & { id: string } {
  return { ...data, id };
}

export async function getBusinessCustomersForBusinessIds(
  businessIds: string[],
): Promise<BusinessCustomer[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessCustomer[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessCustomers"),
        where("businessId", "==", businessId),
        orderBy("updatedAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessCustomer, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessCustomer(input: {
  businessId: string;
  leadId?: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: BusinessCustomerStatus;
  lifetimeValue?: number;
}) {
  const timestamp = now();

  const ref = await addDoc(collection(db, "businessCustomers"), {
    businessId: input.businessId,
    leadId: input.leadId || "",
    name: input.name,
    email: input.email || "",
    phone: input.phone || "",
    notes: input.notes || "",
    status: input.status || "new",
    lifetimeValue: input.lifetimeValue || 0,
    lastContactAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessCustomerStatus(
  customerId: string,
  status: BusinessCustomerStatus,
) {
  await updateDoc(doc(db, "businessCustomers", customerId), {
    status,
    updatedAt: now(),
  });
}

export async function updateBusinessCustomerValue(
  customerId: string,
  lifetimeValue: number,
) {
  await updateDoc(doc(db, "businessCustomers", customerId), {
    lifetimeValue,
    updatedAt: now(),
  });
}

export async function createCustomerFromLead(lead: BusinessLead) {
  return createBusinessCustomer({
    businessId: lead.businessId,
    leadId: lead.id,
    name: lead.visitorName || "Customer",
    email: lead.visitorEmail,
    phone: lead.visitorPhone,
    notes: lead.message,
    status: "new",
    lifetimeValue: 0,
  });
}