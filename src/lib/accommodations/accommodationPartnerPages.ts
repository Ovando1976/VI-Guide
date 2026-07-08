import type {
  CustomerBookingCategory,
  CustomerBookingRecord,
} from "../../data/customerBookingCatalog";

export const ACCOMMODATION_PARTNER_PAGES_KEY =
  "viNavigatorAccommodationPartnerPages";
export const ACCOMMODATION_PAGE_CHANGE_REQUESTS_KEY =
  "viNavigatorAccommodationPageChangeRequests";
export const ACCOMMODATION_IMAGE_SUBMISSIONS_KEY =
  "viNavigatorAccommodationImageSubmissions";

export type AccommodationPartnerPageStatus =
  | "unclaimed"
  | "claim_requested"
  | "active_partner"
  | "paused"
  | "declined"
  | "removed";

export type AccommodationChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "declined_removed";

export type AccommodationPartnerPage = {
  id: string;
  sourceRecordId: string;
  slug: string;
  businessName: string;
  category: CustomerBookingCategory;
  island: string;
  area: string;
  headline: string;
  description: string;
  bestFor: string[];
  bookingOffer: string;
  mobilityNote: string;
  phone: string;
  email: string;
  website: string;
  bookingEmail: string;
  officialBookingUrl: string;
  image: string;
  imageAlt: string;
  imageSourceName: string;
  imageSourceUrl: string;
  imagePermissionNote: string;
  imageStatus:
    | "verified"
    | "partner_supplied"
    | "official_public_candidate"
    | "needs_image"
    | "needs_review";
  seasonalOffer: string;
  pageStatus: AccommodationPartnerPageStatus;
  partnerContactName: string;
  partnerContactEmail: string;
  partnerContactPhone: string;
  submittedAt: string;
  approvedAt?: string;
  updatedAt: string;
};

export type AccommodationPageChangeRequest = AccommodationPartnerPage & {
  requestId: string;
  requestStatus: AccommodationChangeRequestStatus;
  reviewNote?: string;
  reviewedAt?: string;
};

export function accommodationSlugFromText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function accommodationSlug(record: Pick<CustomerBookingRecord, "id" | "businessName">) {
  return record.id || accommodationSlugFromText(record.businessName);
}

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readAccommodationPartnerPages() {
  return readJsonArray<AccommodationPartnerPage>(ACCOMMODATION_PARTNER_PAGES_KEY);
}

export function writeAccommodationPartnerPages(pages: AccommodationPartnerPage[]) {
  writeJsonArray(ACCOMMODATION_PARTNER_PAGES_KEY, pages);
}

export function readAccommodationChangeRequests() {
  return readJsonArray<AccommodationPageChangeRequest>(
    ACCOMMODATION_PAGE_CHANGE_REQUESTS_KEY
  );
}

export function writeAccommodationChangeRequests(
  requests: AccommodationPageChangeRequest[]
) {
  writeJsonArray(ACCOMMODATION_PAGE_CHANGE_REQUESTS_KEY, requests);
}

export function submitAccommodationChangeRequest(
  page: Omit<
    AccommodationPageChangeRequest,
    "requestId" | "requestStatus" | "submittedAt" | "updatedAt"
  >
) {
  const now = new Date().toISOString();

  const request: AccommodationPageChangeRequest = {
    ...page,
    requestId: `accommodation-change-${Date.now()}`,
    requestStatus: "pending",
    submittedAt: now,
    updatedAt: now,
  };

  const next = [request, ...readAccommodationChangeRequests()].slice(0, 500);
  writeAccommodationChangeRequests(next);

  return request;
}

export function approveAccommodationChangeRequest(requestId: string) {
  const now = new Date().toISOString();
  const requests = readAccommodationChangeRequests();

  const request = requests.find((item) => item.requestId === requestId);
  if (!request) return null;

  const approvedRequest: AccommodationPageChangeRequest = {
    ...request,
    requestStatus: "approved",
    pageStatus: "active_partner",
    reviewedAt: now,
    approvedAt: now,
    updatedAt: now,
  };

  const pages = readAccommodationPartnerPages();
  const page: AccommodationPartnerPage = {
    ...approvedRequest,
    pageStatus: "active_partner",
    approvedAt: now,
    updatedAt: now,
  };

  const nextPages = [
    page,
    ...pages.filter((item) => item.sourceRecordId !== page.sourceRecordId),
  ].slice(0, 500);

  const nextRequests = requests.map((item) =>
    item.requestId === requestId ? approvedRequest : item
  );

  writeAccommodationPartnerPages(nextPages);
  writeAccommodationChangeRequests(nextRequests);

  return page;
}

export function rejectAccommodationChangeRequest(requestId: string, reviewNote = "") {
  const now = new Date().toISOString();

  const next = readAccommodationChangeRequests().map((item) =>
    item.requestId === requestId
      ? {
          ...item,
          requestStatus: "rejected" as const,
          reviewNote,
          reviewedAt: now,
          updatedAt: now,
        }
      : item
  );

  writeAccommodationChangeRequests(next);
}

export function declineAndRemoveAccommodation(requestId: string, reviewNote = "") {
  const now = new Date().toISOString();
  const requests = readAccommodationChangeRequests();

  const request = requests.find((item) => item.requestId === requestId);
  if (!request) return null;

  const removedPage: AccommodationPartnerPage = {
    ...request,
    pageStatus: "removed",
    updatedAt: now,
  };

  writeAccommodationPartnerPages([
    removedPage,
    ...readAccommodationPartnerPages().filter(
      (item) => item.sourceRecordId !== removedPage.sourceRecordId
    ),
  ]);

  writeAccommodationChangeRequests(
    requests.map((item) =>
      item.requestId === requestId
        ? {
            ...item,
            requestStatus: "declined_removed" as const,
            pageStatus: "removed" as const,
            reviewNote,
            reviewedAt: now,
            updatedAt: now,
          }
        : item
    )
  );

  return removedPage;
}

export function applyAccommodationPartnerOverrides(
  records: CustomerBookingRecord[]
): CustomerBookingRecord[] {
  const overrides = readAccommodationPartnerPages();

  if (!overrides.length) return records;

  const overrideBySourceId = new Map(
    overrides.map((page) => [page.sourceRecordId, page])
  );

  return records
    .filter((record) => {
      const page = overrideBySourceId.get(record.id);

      if (!page) return true;
      return !["removed", "declined"].includes(page.pageStatus);
    })
    .map((record) => {
      const page = overrideBySourceId.get(record.id);

      if (!page || !["active_partner", "paused"].includes(page.pageStatus)) {
        return record;
      }

      return {
        ...record,
        businessName: page.businessName,
        category: page.category,
        island: page.island as CustomerBookingRecord["island"],
        area: page.area,
        headline: page.headline,
        description: page.description,
        bestFor: page.bestFor,
        bookingOffer: page.bookingOffer,
        mobilityNote: page.mobilityNote,
        phone: page.phone || record.phone,
        website: page.website || record.website,
        image: page.image || record.image,
        imageAlt: page.imageAlt || record.imageAlt,
        imageSourceName: page.imageSourceName || record.imageSourceName,
        imageSourceUrl: page.imageSourceUrl || record.imageSourceUrl,
        imageStatus: page.imageStatus || record.imageStatus,
        sourceName: "Partner-approved page override",
        sourceUrl: page.website || record.sourceUrl,
        lastVerified: page.approvedAt || page.updatedAt,
        verificationStatus: "partner_confirmed",
      };
    });
}

export function createPartnerPageFromRecord(
  record: CustomerBookingRecord
): AccommodationPartnerPage {
  const now = new Date().toISOString();

  return {
    id: `partner-page-${record.id}`,
    sourceRecordId: record.id,
    slug: accommodationSlug(record),
    businessName: record.businessName,
    category: record.category,
    island: record.island,
    area: record.area,
    headline: record.headline,
    description: record.description,
    bestFor: record.bestFor,
    bookingOffer: record.bookingOffer,
    mobilityNote: record.mobilityNote,
    phone: record.phone || "",
    email: "",
    website: record.website || "",
    bookingEmail: "",
    officialBookingUrl: record.website || "",
    image: record.image,
    imageAlt: record.imageAlt || `${record.businessName} accommodation image`,
    imageSourceName: record.imageSourceName || "Official/public image candidate",
    imageSourceUrl: record.imageSourceUrl || record.sourceUrl || "",
    imagePermissionNote:
      record.imageStatus === "official_public_candidate"
        ? "Official public image candidate. Partner approval needed before marking verified."
        : "",
    imageStatus: record.imageStatus || "needs_review",
    seasonalOffer: "",
    pageStatus: "claim_requested",
    partnerContactName: "",
    partnerContactEmail: "",
    partnerContactPhone: "",
    submittedAt: now,
    updatedAt: now,
  };
}
