import type {
  CruiseInventoryCapabilities,
  CruiseInventoryProviderId,
  CruiseInventoryReadiness,
  CruiseInventoryStage,
} from "@/lib/cruise-inventory/types";

const EMPTY_CAPABILITIES: CruiseInventoryCapabilities = {
  search: false,
  sailingDetails: false,
  cabinAvailability: false,
  livePricing: false,
  quote: false,
  reprice: false,
  hold: false,
  booking: false,
  retrieveBooking: false,
  cancelBooking: false,
  supplierPayments: false,
  webhooks: false,
};

const MOCK_CAPABILITIES: CruiseInventoryCapabilities = {
  search: true,
  sailingDetails: true,
  cabinAvailability: true,
  livePricing: false,
  quote: true,
  reprice: true,
  hold: true,
  booking: true,
  retrieveBooking: true,
  cancelBooking: true,
  supplierPayments: false,
  webhooks: false,
};

// This must only become true in the same reviewed change that adds a tested,
// provider-specific adapter. Environment variables alone cannot enable live sales.
const EXTERNAL_ADAPTER_IMPLEMENTED = false;

export function getCruiseInventoryReadiness(
  env: NodeJS.ProcessEnv = process.env,
): CruiseInventoryReadiness {
  const provider = normalizeProvider(env.CRUISE_INVENTORY_PROVIDER);
  const environment = normalizeEnvironment(env);

  if (provider === "mock") {
    const enabled =
      environment !== "production" &&
      env.CRUISE_INVENTORY_ENABLE_MOCK === "true";
    return {
      provider,
      stage: enabled ? "adapter_validation" : "disabled",
      environment,
      enabled,
      live: false,
      capabilities: enabled ? MOCK_CAPABILITIES : EMPTY_CAPABILITIES,
      configuredRequirements: enabled
        ? ["Mock provider explicitly enabled outside production"]
        : [],
      missingRequirements: enabled
        ? []
        : [
            "Set CRUISE_INVENTORY_ENABLE_MOCK=true in a non-production environment",
          ],
      nextAction: enabled
        ? "Use the mock provider to validate VI Guide search, quote, hold, and booking contracts."
        : "Enable the mock provider only in development or preview for integration testing.",
    };
  }

  if (provider === "traveltek" || provider === "revelex") {
    const contractApproved = env.CRUISE_INVENTORY_CONTRACT_APPROVED === "true";
    const sandboxCredentials = hasExternalProviderCredentials(provider, env);
    const adapterRequested = env.CRUISE_INVENTORY_ADAPTER_ENABLED === "true";
    const adapterEnabled = adapterRequested && EXTERNAL_ADAPTER_IMPLEMENTED;
    const productionCertified =
      adapterEnabled &&
      env.CRUISE_INVENTORY_PRODUCTION_CERTIFIED === "true";

    const configuredRequirements = [
      contractApproved ? "Commercial contract approved" : null,
      sandboxCredentials ? "Sandbox credentials configured" : null,
      adapterRequested ? "Provider adapter enablement requested" : null,
      adapterEnabled ? "Provider adapter explicitly enabled" : null,
      productionCertified ? "Production certification approved" : null,
    ].filter((value): value is string => Boolean(value));

    const missingRequirements = [
      !contractApproved
        ? `Execute the ${providerName(provider)} commercial agreement`
        : null,
      !sandboxCredentials
        ? `Configure ${providerName(provider)} sandbox credentials and agency identifier`
        : null,
      !EXTERNAL_ADAPTER_IMPLEMENTED
        ? `Implement, review, and test the ${providerName(provider)} provider adapter against official documentation`
        : null,
      !adapterRequested
        ? `Explicitly enable the ${providerName(provider)} adapter after review`
        : null,
      !productionCertified
        ? "Complete supplier production certification and controlled booking tests"
        : null,
      "Confirm cruise-line supplier credentials under VI Guide or its host agency",
      "Approve supplier-hosted payment, cancellation, and chargeback responsibilities",
    ].filter((value): value is string => Boolean(value));

    const stage = determineExternalStage({
      contractApproved,
      sandboxCredentials,
      adapterEnabled,
      productionCertified,
    });

    return {
      provider,
      stage,
      environment,
      enabled: false,
      live: false,
      capabilities: EMPTY_CAPABILITIES,
      configuredRequirements,
      missingRequirements: Array.from(new Set(missingRequirements)),
      nextAction: !contractApproved
        ? `Complete ${providerName(provider)} commercial onboarding.`
        : !sandboxCredentials
          ? `Obtain and configure ${providerName(provider)} sandbox credentials and documentation.`
          : `Implement and certify the ${providerName(provider)} adapter before enabling provider calls.`,
    };
  }

  return {
    provider: "disabled",
    stage: "disabled",
    environment,
    enabled: false,
    live: false,
    capabilities: EMPTY_CAPABILITIES,
    configuredRequirements: [],
    missingRequirements: [
      "Select Traveltek or Revelex as the contracted provider",
      "Execute a provider agreement and obtain sandbox documentation",
      "Obtain agency and cruise-line supplier credentials",
      "Complete supplier-hosted payment and servicing agreements",
    ],
    nextAction:
      "Request commercial proposals and sandbox access from Traveltek and Revelex.",
  };
}

export function publicCruiseInventoryStatus(
  readiness: CruiseInventoryReadiness = getCruiseInventoryReadiness(),
) {
  return {
    provider: readiness.provider,
    stage: readiness.stage,
    enabled: readiness.enabled,
    live: readiness.live,
    capabilities: readiness.capabilities,
    nextAction: readiness.nextAction,
  };
}

export function providerName(provider: CruiseInventoryProviderId) {
  if (provider === "traveltek") return "Traveltek";
  if (provider === "revelex") return "Revelex";
  if (provider === "mock") return "VI Guide Mock Inventory";
  return "No provider";
}

function normalizeProvider(value: unknown): CruiseInventoryProviderId {
  return value === "mock" || value === "traveltek" || value === "revelex"
    ? value
    : "disabled";
}

function normalizeEnvironment(
  env: NodeJS.ProcessEnv,
): CruiseInventoryReadiness["environment"] {
  if (env.NODE_ENV === "test") return "test";
  if (env.VERCEL_ENV === "production" || env.NODE_ENV === "production") {
    return "production";
  }
  if (env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

function hasExternalProviderCredentials(
  provider: "traveltek" | "revelex",
  env: NodeJS.ProcessEnv,
) {
  const prefix = provider === "traveltek" ? "TRAVELTEK" : "REVELEX";
  return Boolean(
    env[`${prefix}_API_BASE_URL`]?.trim() &&
      env[`${prefix}_API_KEY`]?.trim() &&
      env[`${prefix}_AGENCY_ID`]?.trim(),
  );
}

function determineExternalStage(input: {
  contractApproved: boolean;
  sandboxCredentials: boolean;
  adapterEnabled: boolean;
  productionCertified: boolean;
}): CruiseInventoryStage {
  if (!input.contractApproved) return "commercial_access";
  if (!input.sandboxCredentials) return "sandbox_credentials";
  if (!input.adapterEnabled) return "adapter_validation";
  if (!input.productionCertified) return "production_certification";
  return "production_certification";
}
