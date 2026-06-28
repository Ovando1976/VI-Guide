import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import type { Business, BusinessClaim, BusinessLead } from "../../types/business";

const BUSINESSES = "businesses";
const LEADS = "businessLeads";
const ANALYTICS = "businessAnalytics";
const CLAIMS = "businessClaims";

export type BusinessAnalytics = {
  id: string;
  businessId: string;
  profileViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  leadCount: number;
  updatedAt: number;
};

export type BusinessLeadStatus = "new" | "contacted" | "won" | "lost";

function withId<T>(snap: { id: string; data: () => unknown }): T {
  return {
    id: snap.id,
    ...(snap.data() as object),
  } as T;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export async function getBusinesses(): Promise<Business[]> {
  const snap = await getDocs(collection(db, BUSINESSES));
  return snap.docs.map((docSnap) => withId<Business>(docSnap));
}

export async function getFeaturedBusinesses(): Promise<Business[]> {
  const q = query(
    collection(db, BUSINESSES),
    where("featured", "==", true),
    limit(20),
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => withId<Business>(docSnap));
}

export async function getBusinessesForOwner(ownerId: string): Promise<Business[]> {
  const q = query(collection(db, BUSINESSES), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => withId<Business>(docSnap));
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, BUSINESSES, id));
  return snap.exists() ? withId<Business>(snap) : null;
}

export async function getBusinessBySlug(slugOrId: string): Promise<Business | null> {
  const bySlug = query(
    collection(db, BUSINESSES),
    where("slug", "==", slugOrId),
    limit(1),
  );

  const slugSnap = await getDocs(bySlug);

  if (!slugSnap.empty) {
    return withId<Business>(slugSnap.docs[0]);
  }

  return getBusinessById(slugOrId);
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>,
): Promise<void> {
  await updateDoc(doc(db, BUSINESSES, businessId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function createBusinessClaim(
  input: Omit<BusinessClaim, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();

  const ref = await addDoc(collection(db, CLAIMS), {
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function createBusinessLead(
  input: Omit<BusinessLead, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();

  const ref = await addDoc(collection(db, LEADS), {
    ...input,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });

  await trackBusinessEvent(input.businessId, "leadCount");

  return ref.id;
}

export async function getBusinessLeadsForBusiness(
  businessId: string,
): Promise<BusinessLead[]> {
  const q = query(
    collection(db, LEADS),
    where("businessId", "==", businessId),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => withId<BusinessLead>(docSnap));
}

export async function getBusinessLeadsForBusinessIds(
  businessIds: string[],
): Promise<BusinessLead[]> {
  if (!businessIds.length) return [];

  const chunks = chunkArray(Array.from(new Set(businessIds)), 10);
  const leads: BusinessLead[] = [];

  for (const chunk of chunks) {
    const q = query(
      collection(db, LEADS),
      where("businessId", "in", chunk),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const snap = await getDocs(q);
    leads.push(...snap.docs.map((docSnap) => withId<BusinessLead>(docSnap)));
  }

  return leads.sort((a, b) => {
    const aTime = typeof a.createdAt === "number" ? a.createdAt : 0;
    const bTime = typeof b.createdAt === "number" ? b.createdAt : 0;
    return bTime - aTime;
  });
}

export async function updateBusinessLeadStatus(
  leadId: string,
  status: BusinessLeadStatus,
): Promise<void> {
  await updateDoc(doc(db, LEADS, leadId), {
    status,
    updatedAt: Date.now(),
  });
}

export async function trackBusinessEvent(
  businessId: string,
  event:
    | "profileViews"
    | "websiteClicks"
    | "phoneClicks"
    | "directionRequests"
    | "leadCount",
): Promise<void> {
  const ref = doc(db, ANALYTICS, businessId);

  await setDoc(
    ref,
    {
      businessId,
      [event]: increment(1),
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function ensureAnalytics(businessId: string): Promise<void> {
  const ref = doc(db, ANALYTICS, businessId);

  await setDoc(
    ref,
    {
      businessId,
      profileViews: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionRequests: 0,
      leadCount: 0,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function getBusinessAnalytics(): Promise<BusinessAnalytics[]> {
  const snap = await getDocs(collection(db, ANALYTICS));
  return snap.docs.map((docSnap) => withId<BusinessAnalytics>(docSnap));
}

export async function getBusinessAnalyticsForBusiness(
  businessId: string,
): Promise<BusinessAnalytics | null> {
  const snap = await getDoc(doc(db, ANALYTICS, businessId));
  return snap.exists() ? withId<BusinessAnalytics>(snap) : null;
}

export async function getBusinessAnalyticsForBusinessIds(
  businessIds: string[],
): Promise<BusinessAnalytics[]> {
  if (!businessIds.length) return [];

  const analytics: BusinessAnalytics[] = [];

  for (const businessId of businessIds) {
    const row = await getBusinessAnalyticsForBusiness(businessId);
    if (row) analytics.push(row);
  }

  return analytics;
}