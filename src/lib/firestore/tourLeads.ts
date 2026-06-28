import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

export type TourLeadIntent = "tour" | "ride" | "bundle";

export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "completed"
  | "cancelled";

export type CreateTourLeadInput = {
  siteId?: string;
  siteName?: string;
  island?: string;
  intent?: TourLeadIntent;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  guestCount?: number | null;
  preferredDate?: string | null;
  pickupLocation?: string | null;
  specialRequests?: string | null;
  userId?: string | null;
  estimatedValue?: number;
  source?: string;
};

export type UpdateTourLeadInput = Partial<CreateTourLeadInput> & {
  status?: LeadStatus;
};

const TOUR_LEADS_COLLECTION = "tourLeads";

function cleanString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function cleanNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function createTourLead(input: CreateTourLeadInput): Promise<string> {
  const payload = {
    siteId: cleanString(input.siteId),
    siteName: cleanString(input.siteName) || "Historic Site",
    island: cleanString(input.island) || "st_thomas",
    intent: input.intent || "tour",
    customerName: cleanString(input.customerName),
    customerEmail: cleanString(input.customerEmail),
    customerPhone: cleanString(input.customerPhone),
    guestCount: cleanNumber(input.guestCount),
    preferredDate: cleanString(input.preferredDate),
    pickupLocation: cleanString(input.pickupLocation),
    specialRequests: cleanString(input.specialRequests),
    userId: cleanString(input.userId),
    estimatedValue: Number(input.estimatedValue || 0),
    source: cleanString(input.source) || "historic-site-concierge",
    status: "new" as LeadStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const leadRef = await addDoc(collection(db, TOUR_LEADS_COLLECTION), payload);
  return leadRef.id;
}

export async function updateTourLead(
  id: string,
  input: UpdateTourLeadInput,
): Promise<void> {
  if (!id) throw new Error("Missing tour lead id");

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if ("siteId" in input) updates.siteId = cleanString(input.siteId);
  if ("siteName" in input) updates.siteName = cleanString(input.siteName);
  if ("island" in input) updates.island = cleanString(input.island);
  if ("intent" in input) updates.intent = input.intent || "tour";
  if ("customerName" in input) updates.customerName = cleanString(input.customerName);
  if ("customerEmail" in input) updates.customerEmail = cleanString(input.customerEmail);
  if ("customerPhone" in input) updates.customerPhone = cleanString(input.customerPhone);
  if ("guestCount" in input) updates.guestCount = cleanNumber(input.guestCount);
  if ("preferredDate" in input) updates.preferredDate = cleanString(input.preferredDate);
  if ("pickupLocation" in input) updates.pickupLocation = cleanString(input.pickupLocation);
  if ("specialRequests" in input) updates.specialRequests = cleanString(input.specialRequests);
  if ("userId" in input) updates.userId = cleanString(input.userId);
  if ("estimatedValue" in input) updates.estimatedValue = Number(input.estimatedValue || 0);
  if ("source" in input) updates.source = cleanString(input.source);
  if ("status" in input) updates.status = input.status || "new";

  await updateDoc(doc(db, TOUR_LEADS_COLLECTION, id), updates);
}