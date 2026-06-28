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

export type MoneyStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "paid"
  | "void";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export type BusinessLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type BusinessEstimate = {
  id: string;
  businessId: string;
  leadId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  notes?: string;
  status: MoneyStatus;
  lineItems: BusinessLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: number;
  updatedAt: number;
};

export type BusinessInvoice = {
  id: string;
  businessId: string;
  leadId?: string;
  estimateId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  notes?: string;
  status: MoneyStatus;
  lineItems: BusinessLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  dueAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type BusinessPayment = {
  id: string;
  businessId: string;
  invoiceId?: string;
  customerName?: string;
  method?: string;
  status: PaymentStatus;
  amount: number;
  notes?: string;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
};

const now = () => Date.now();

function withId<T>(id: string, data: T): T & { id: string } {
  return { ...data, id };
}

function normalizeLineItems(
  lineItems: Array<Partial<BusinessLineItem>>,
): BusinessLineItem[] {
  return lineItems.map((item, index) => {
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unitPrice ?? 0);
    const total = Number(item.total ?? quantity * unitPrice);

    return {
      id: item.id || `line-${index + 1}`,
      description: item.description || "Service item",
      quantity,
      unitPrice,
      total,
    };
  });
}

function calculateTotals(lineItems: BusinessLineItem[], taxRate = 0) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return { subtotal, tax, total };
}

export async function getBusinessEstimatesForBusinessIds(
  businessIds: string[],
): Promise<BusinessEstimate[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessEstimate[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessEstimates"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessEstimate, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessEstimate(input: {
  businessId: string;
  leadId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  notes?: string;
  lineItems: Array<Partial<BusinessLineItem>>;
  taxRate?: number;
}) {
  const timestamp = now();
  const lineItems = normalizeLineItems(input.lineItems);
  const totals = calculateTotals(lineItems, input.taxRate ?? 0);

  const ref = await addDoc(collection(db, "businessEstimates"), {
    businessId: input.businessId,
    leadId: input.leadId || "",
    customerName: input.customerName || "",
    customerEmail: input.customerEmail || "",
    customerPhone: input.customerPhone || "",
    title: input.title,
    notes: input.notes || "",
    status: "draft",
    lineItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessEstimateStatus(
  estimateId: string,
  status: MoneyStatus,
) {
  await updateDoc(doc(db, "businessEstimates", estimateId), {
    status,
    updatedAt: now(),
  });
}

export async function getBusinessInvoicesForBusinessIds(
  businessIds: string[],
): Promise<BusinessInvoice[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessInvoice[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessInvoices"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessInvoice, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessInvoice(input: {
  businessId: string;
  leadId?: string;
  estimateId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  notes?: string;
  lineItems: Array<Partial<BusinessLineItem>>;
  taxRate?: number;
  dueAt?: number;
}) {
  const timestamp = now();
  const lineItems = normalizeLineItems(input.lineItems);
  const totals = calculateTotals(lineItems, input.taxRate ?? 0);

  const ref = await addDoc(collection(db, "businessInvoices"), {
    businessId: input.businessId,
    leadId: input.leadId || "",
    estimateId: input.estimateId || "",
    customerName: input.customerName || "",
    customerEmail: input.customerEmail || "",
    customerPhone: input.customerPhone || "",
    title: input.title,
    notes: input.notes || "",
    status: "draft",
    lineItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    amountPaid: 0,
    balanceDue: totals.total,
    dueAt: input.dueAt || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessInvoiceStatus(
  invoiceId: string,
  status: MoneyStatus,
) {
  await updateDoc(doc(db, "businessInvoices", invoiceId), {
    status,
    updatedAt: now(),
  });
}

export async function getBusinessPaymentsForBusinessIds(
  businessIds: string[],
): Promise<BusinessPayment[]> {
  if (businessIds.length === 0) return [];

  const rows: BusinessPayment[] = [];

  for (const businessId of businessIds) {
    const snap = await getDocs(
      query(
        collection(db, "businessPayments"),
        where("businessId", "==", businessId),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    rows.push(
      ...snap.docs.map((item) =>
        withId(item.id, item.data() as Omit<BusinessPayment, "id">),
      ),
    );
  }

  return rows;
}

export async function createBusinessPayment(input: {
  businessId: string;
  invoiceId?: string;
  customerName?: string;
  method?: string;
  status?: PaymentStatus;
  amount: number;
  notes?: string;
  paidAt?: number;
}) {
  const timestamp = now();

  const ref = await addDoc(collection(db, "businessPayments"), {
    businessId: input.businessId,
    invoiceId: input.invoiceId || "",
    customerName: input.customerName || "",
    method: input.method || "manual",
    status: input.status || "completed",
    amount: Number(input.amount || 0),
    notes: input.notes || "",
    paidAt: input.paidAt || timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessPaymentStatus(
  paymentId: string,
  status: PaymentStatus,
) {
  await updateDoc(doc(db, "businessPayments", paymentId), {
    status,
    updatedAt: now(),
  });
}