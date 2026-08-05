export type MerchantAccessRole =
  | "rider"
  | "driver"
  | "merchant"
  | "dispatcher"
  | "admin";

export type MerchantAccessSession = {
  role: MerchantAccessRole;
  listingIds?: readonly string[];
};

const STAFF_ROLES = new Set<MerchantAccessRole>(["admin", "dispatcher"]);
const MAX_MANAGED_LISTINGS = 30;

export function normalizeManagedListingIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => cleanListingId(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).slice(0, MAX_MANAGED_LISTINGS);
}

export function managedListingIdsForSession(
  session: MerchantAccessSession,
): string[] {
  return session.role === "merchant"
    ? normalizeManagedListingIds(session.listingIds)
    : [];
}

export function canManageListing(
  session: MerchantAccessSession,
  listingId: unknown,
) {
  const normalizedListingId = cleanListingId(listingId);
  if (!normalizedListingId) return false;
  if (STAFF_ROLES.has(session.role)) return true;
  if (session.role !== "merchant") return false;

  return managedListingIdsForSession(session).includes(normalizedListingId);
}

export function isMerchantOperationsRole(
  role: MerchantAccessRole,
): role is "merchant" | "dispatcher" | "admin" {
  return role === "merchant" || role === "dispatcher" || role === "admin";
}

function cleanListingId(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, 160)
    : "";
}
