import "server-only";

import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

const ISLANDS: IslandCode[] = ["stt", "stj", "stx"];

export type TaxiTariffDraftInput = {
  title?: unknown;
  version?: unknown;
  island?: unknown;
  effectiveAt?: unknown;
  sourceUrl?: unknown;
  rules?: unknown;
};

export function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function optionalStringList(value: unknown, label: string) {
  if (value == null) return undefined;
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`);
  const entries = value.map((item) => requiredText(item, label));
  return Array.from(new Set(entries));
}

function requiredStringList(value: unknown, label: string) {
  return optionalStringList(value, label) ?? [];
}

function nonNegativeNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return Number(number.toFixed(2));
}

function optionalNonNegativeNumber(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  return nonNegativeNumber(value, label);
}

function optionalNonNegativeInteger(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative whole number.`);
  }
  return number;
}

function normalizeRule(value: unknown, index: number): OfficialTaxiRateRule {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Rule ${index + 1} must be an object.`);
  }

  const input = value as Record<string, unknown>;
  const id = requiredText(input.id, `Rule ${index + 1} ID`);
  const originNames = requiredStringList(
    input.originNames,
    `Rule ${id} origin names`,
  );
  const destinationNames = requiredStringList(
    input.destinationNames,
    `Rule ${id} destination names`,
  );
  const originEstateGeoids = optionalStringList(
    input.originEstateGeoids,
    `Rule ${id} origin estate GEOIDs`,
  );
  const destinationEstateGeoids = optionalStringList(
    input.destinationEstateGeoids,
    `Rule ${id} destination estate GEOIDs`,
  );

  if (!originNames.length && !originEstateGeoids?.length) {
    throw new Error(`Rule ${id} needs at least one origin name or GEOID.`);
  }
  if (!destinationNames.length && !destinationEstateGeoids?.length) {
    throw new Error(`Rule ${id} needs at least one destination name or GEOID.`);
  }

  const additionalPassengerFare = optionalNonNegativeNumber(
    input.additionalPassengerFare,
    `Rule ${id} additional passenger fare`,
  );
  const perPersonFare = optionalNonNegativeNumber(
    input.perPersonFare,
    `Rule ${id} per-person fare`,
  );
  if (
    typeof additionalPassengerFare === "number" &&
    typeof perPersonFare === "number"
  ) {
    throw new Error(
      `Rule ${id} cannot define both an additional-passenger fare and a per-person fare.`,
    );
  }

  const notes =
    typeof input.notes === "string" && input.notes.trim()
      ? input.notes.trim()
      : undefined;

  return {
    id,
    originNames,
    destinationNames,
    ...(originEstateGeoids?.length ? { originEstateGeoids } : {}),
    ...(destinationEstateGeoids?.length ? { destinationEstateGeoids } : {}),
    onePassengerFare: nonNegativeNumber(
      input.onePassengerFare,
      `Rule ${id} one-passenger fare`,
    ),
    ...(typeof additionalPassengerFare === "number"
      ? { additionalPassengerFare }
      : {}),
    ...(typeof perPersonFare === "number" ? { perPersonFare } : {}),
    ...(typeof input.luggageFarePerPiece !== "undefined"
      ? {
          luggageFarePerPiece: nonNegativeNumber(
            input.luggageFarePerPiece,
            `Rule ${id} luggage fare`,
          ),
        }
      : {}),
    ...(typeof input.luggageIncluded !== "undefined"
      ? {
          luggageIncluded: optionalNonNegativeInteger(
            input.luggageIncluded,
            `Rule ${id} included luggage`,
          ),
        }
      : {}),
    ...(notes ? { notes } : {}),
  };
}

export function normalizeTariffDraft(
  input: TaxiTariffDraftInput,
): Omit<
  OfficialTaxiTariff,
  | "id"
  | "status"
  | "activationStatus"
  | "activatedAt"
  | "activatedBy"
  | "activationReviewReference"
> {
  const island = requiredText(input.island, "Island") as IslandCode;
  if (!ISLANDS.includes(island)) {
    throw new Error("Island must be St. Thomas, St. John, or St. Croix.");
  }

  const effectiveAt = requiredText(input.effectiveAt, "Effective date");
  if (!Number.isFinite(Date.parse(effectiveAt))) {
    throw new Error("Effective date is invalid.");
  }

  const sourceUrl = requiredText(input.sourceUrl, "Official source URL");
  let parsedSource: URL;
  try {
    parsedSource = new URL(sourceUrl);
  } catch {
    throw new Error("Official source URL is invalid.");
  }
  if (!["http:", "https:"].includes(parsedSource.protocol)) {
    throw new Error("Official source URL must use HTTP or HTTPS.");
  }

  if (!Array.isArray(input.rules) || !input.rules.length) {
    throw new Error("At least one official route rule is required.");
  }
  if (input.rules.length > 2000) {
    throw new Error("A tariff cannot contain more than 2,000 route rules.");
  }

  const rules = input.rules.map(normalizeRule);
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`Duplicate rule ID: ${rule.id}.`);
    ids.add(rule.id);
  }

  return {
    title: requiredText(input.title, "Tariff title"),
    version: requiredText(input.version, "Tariff version"),
    island,
    effectiveAt,
    sourceUrl: parsedSource.toString(),
    issuingAuthority: "Virgin Islands Taxicab Commission",
    currency: "USD",
    rules,
  };
}

export function assertVerifiedActiveTariff(
  tariff: OfficialTaxiTariff,
): OfficialTaxiTariff {
  normalizeTariffDraft(tariff);
  if (tariff.status !== "active") {
    throw new Error("The selected tariff is not active.");
  }
  if (tariff.issuingAuthority !== "Virgin Islands Taxicab Commission") {
    throw new Error("The active tariff does not identify the required issuing authority.");
  }
  if (tariff.currency !== "USD") {
    throw new Error("The active tariff currency is invalid.");
  }
  if (Date.parse(tariff.effectiveAt) > Date.now()) {
    throw new Error("The active tariff is not effective yet.");
  }
  if (
    tariff.activationStatus !== "verified" ||
    !tariff.activatedBy ||
    !tariff.activatedAt ||
    !tariff.activationReviewReference
  ) {
    throw new Error(
      "The active tariff was not activated through the reviewed governance workflow.",
    );
  }
  return tariff;
}
