import { normalizeManagedListingIds } from "@/lib/merchant-access";

export type ProvisionableMerchantRole = "rider" | "merchant";

export function normalizeProvisioningEmail(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().slice(0, 220)
    : "";
}

export function provisionableMerchantRole(value: unknown): ProvisionableMerchantRole | null {
  return value === "rider" || value === "merchant" ? value : null;
}

export function merchantClaimsForUpdate(input: {
  currentClaims: Record<string, unknown> | undefined;
  enabled: boolean;
  listingIds: unknown;
}) {
  const currentClaims = { ...(input.currentClaims ?? {}) };
  const currentRole =
    currentClaims.role == null
      ? "rider"
      : provisionableMerchantRole(currentClaims.role);

  if (!currentRole) {
    return {
      ok: false as const,
      error:
        "Only rider and merchant accounts can be changed from merchant access management.",
    };
  }

  const listingIds = normalizeManagedListingIds(input.listingIds);
  if (input.enabled && !listingIds.length) {
    return {
      ok: false as const,
      error: "Assign at least one listing before granting merchant access.",
    };
  }

  const nextClaims: Record<string, unknown> = {
    ...currentClaims,
    role: input.enabled ? "merchant" : "rider",
  };

  delete nextClaims.driverId;
  if (input.enabled) nextClaims.listingIds = listingIds;
  else delete nextClaims.listingIds;

  return {
    ok: true as const,
    currentRole,
    previousListingIds: normalizeManagedListingIds(currentClaims.listingIds),
    nextRole: (input.enabled ? "merchant" : "rider") as ProvisionableMerchantRole,
    listingIds: input.enabled ? listingIds : [],
    claims: nextClaims,
  };
}
