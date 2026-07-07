export type PartnerListingStatus = "draft" | "active" | "featured";

export type PartnerListing = {
  id: string;
  sourceLeadId?: string;
  businessName: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  island: string;
  offer: string;
  description: string;
  planTier: string;
  listingStatus: PartnerListingStatus;
  logoUrl: string;
  heroImageUrl: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  updatedAt: string;
};

export const PARTNER_LISTINGS_KEY = "viNavigatorPartnerListings";

export function readPartnerListings(): PartnerListing[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PARTNER_LISTINGS_KEY) || "[]"
    ) as PartnerListing[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizePartnerText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function activePartnerListings(listings: PartnerListing[]) {
  return listings.filter((listing) => listing.listingStatus !== "draft");
}

export function featuredPartnerListings(listings: PartnerListing[]) {
  return listings.filter((listing) => listing.listingStatus === "featured");
}
