import {
  addDoc,
  collection,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "../../firebase";

export type PropertyReportTier = "starter" | "full" | "premium";

export type PropertyReportLeadInput = {
  name: string;
  email: string;
  phone?: string;
  island: string;
  propertyName: string;
  parcelId?: string;
  address?: string;
  purpose: string;
  tier: PropertyReportTier;
  notes?: string;
  leadSummary?: string;
  source?: string;
};

const PROPERTY_REPORT_LEADS_COLLECTION = "propertyReportLeads";

export async function createPropertyReportLead(
  lead: PropertyReportLeadInput,
): Promise<DocumentReference> {
  const payload = {
    ...lead,
    status: "new",
    priority: lead.tier === "premium" ? "high" : "normal",
    source: lead.source || "history-property-report-page",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return addDoc(collection(db, PROPERTY_REPORT_LEADS_COLLECTION), payload);
}
