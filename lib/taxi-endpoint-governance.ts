import type { IslandCode } from "@/types/usvi";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STT_ENDPOINT_REVIEW_GATES = new Map<string, string>([
  [
    "town",
    "Town cannot be treated as Charlotte Amalie until the tariff endpoint identity is confirmed.",
  ],
  [
    "lindbergh bay",
    "Lindbergh Bay cannot inherit Airport Terminal pricing until the tariff endpoint identity is confirmed.",
  ],
  [
    "estate lindbergh bay",
    "Lindbergh Bay cannot inherit Airport Terminal pricing until the tariff endpoint identity is confirmed.",
  ],
  [
    "dorothea estate",
    "Dorothea Estate cannot inherit Dorothea pricing until the tariff endpoint identity is confirmed.",
  ],
  [
    "estate dorothea",
    "Dorothea Estate cannot inherit Dorothea pricing until the tariff endpoint identity is confirmed.",
  ],
]);

export function taxiEndpointGovernanceHold(params: {
  island: IslandCode;
  placeName: string;
  tariffEndpointName?: string;
}) {
  if (params.island !== "stt") return undefined;

  return [params.placeName, params.tariffEndpointName]
    .filter((value): value is string => Boolean(value))
    .map((value) => STT_ENDPOINT_REVIEW_GATES.get(normalize(value)))
    .find((value): value is string => Boolean(value));
}
