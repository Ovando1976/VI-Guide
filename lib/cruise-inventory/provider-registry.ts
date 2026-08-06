import { MockCruiseInventoryProvider } from "@/lib/cruise-inventory/mock-provider";
import {
  CruiseProviderError,
  type CruiseInventoryProvider,
} from "@/lib/cruise-inventory/provider";
import { getCruiseInventoryReadiness } from "@/lib/cruise-inventory/readiness";

let mockProvider: MockCruiseInventoryProvider | null = null;

export function getCruiseInventoryProvider(): CruiseInventoryProvider {
  const readiness = getCruiseInventoryReadiness();

  if (readiness.provider === "mock" && readiness.enabled) {
    mockProvider ??= new MockCruiseInventoryProvider();
    return mockProvider;
  }

  if (readiness.provider === "traveltek" || readiness.provider === "revelex") {
    throw new CruiseProviderError(
      "provider_not_ready",
      `${readiness.provider === "traveltek" ? "Traveltek" : "Revelex"} live inventory is not enabled until the commercial contract, supplier credentials, adapter certification, and production approval are complete.`,
      503,
      false,
    );
  }

  throw new CruiseProviderError(
    "provider_disabled",
    "Live cruise inventory has not been connected yet.",
    503,
    false,
  );
}
