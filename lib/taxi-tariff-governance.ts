import { applyKnownTariffReviewGates } from "@/lib/taxi-tariff-review-gates";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
  TaxiFareConfirmationScope,
} from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

const ISLANDS: IslandCode[] = ["stt", "stj", "stx"];
const FARE_CONFIRMATION_SCOPES: TaxiFareConfirmationScope[] = [
  "all",
  "two_or_more",
];

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

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function assertCandidateAliasesAreReviewOnly(
  canonicalNames: string[],
  candidateAliases: string[] | undefined,
  label: string,
) {
  if (!candidateAliases?.length) return;
  const canonical = new Set(canonicalNames.map(normalizeComparable));
  const overlap = candidateAliases.find((alias) =>
    canonical.has(normalizeComparable(alias)),
  );
  if (overlap) {
    throw new Error(
      `${label} candidate alias “${overlap}” is also listed as a canonical name. Remove it from the canonical names until human confirmation is complete.`,
    );
  }
}

function nonNegativeNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return Number(number.toFixed(2));
}

function positiveNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return Number(number.toFixed(2));
}

function optionalNonNegativeNumber(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  return nonNegativeNumber(value, label);
}

function optionalPositiveNumber(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  return positiveNumber(value, label);
}

function optionalNonNegativeInteger(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a non-negative whole number.`);
  }
  return number;
}

function optionalFareConfirmationScope(
  value: unknown,
  label: string,
): TaxiFareConfirmationScope | undefined {
  if (value == null || value === "") return undefined;
  if (
    typeof value !== "string" ||
    !FARE_CONFIRMATION_SCOPES.includes(value as TaxiFareConfirmationScope)
  ) {
    throw new Error(`${label} must be “all” or “two_or_more”.`);
  }
  return value as TaxiFareConfirmationScope;
}

function normalizeRule(value: unknown, index: number): OfficialTaxiRateRule {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Rule ${index + 1} must be an object.`);
  }

  const input = value as Record<string, unknown>;
  const id = requiredText(input.id, `Rule ${index + 1} ID`);
  const originNames = requiredStringList(input.originNames, `Rule ${id} origin names`);
  const destinationNames = requiredStringList(input.destinationNames, `Rule ${id} destination names`);
  const originCandidateAliases = optionalStringList(input.originCandidateAliases, `Rule ${id} origin candidate aliases`);
  const destinationCandidateAliases = optionalStringList(input.destinationCandidateAliases, `Rule ${id} destination candidate aliases`);
  const originEstateGeoids = optionalStringList(input.originEstateGeoids, `Rule ${id} origin estate GEOIDs`);
  const destinationEstateGeoids = optionalStringList(input.destinationEstateGeoids, `Rule ${id} destination estate GEOIDs`);

  if (!originNames.length && !originEstateGeoids?.length) throw new Error(`Rule ${id} needs at least one origin name or GEOID.`);
  if (!destinationNames.length && !destinationEstateGeoids?.length) throw new Error(`Rule ${id} needs at least one destination name or GEOID.`);

  assertCandidateAliasesAreReviewOnly(originNames, originCandidateAliases, `Rule ${id} origin`);
  assertCandidateAliasesAreReviewOnly(destinationNames, destinationCandidateAliases, `Rule ${id} destination`);

  const additionalPassengerFare = optionalNonNegativeNumber(input.additionalPassengerFare, `Rule ${id} additional passenger fare`);
  const perPersonFare = optionalPositiveNumber(input.perPersonFare, `Rule ${id} per-person fare`);
  if (typeof additionalPassengerFare === "number" && typeof perPersonFare === "number") {
    throw new Error(`Rule ${id} cannot define both an additional-passenger fare and a per-person fare.`);
  }

  const fareConfirmationRequired = optionalFareConfirmationScope(input.fareConfirmationRequired, `Rule ${id} fare confirmation scope`);
  const fareConfirmationReason = typeof input.fareConfirmationReason === "string" && input.fareConfirmationReason.trim() ? input.fareConfirmationReason.trim() : undefined;
  if (fareConfirmationRequired && !fareConfirmationReason) throw new Error(`Rule ${id} needs a fare confirmation reason when automatic quoting is restricted.`);
  if (!fareConfirmationRequired && fareConfirmationReason) throw new Error(`Rule ${id} cannot define a fare confirmation reason without a confirmation scope.`);

  const notes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : undefined;

  return {
    id,
    originNames,
    destinationNames,
    ...(originCandidateAliases?.length ? { originCandidateAliases } : {}),
    ...(destinationCandidateAliases?.length ? { destinationCandidateAliases } : {}),
    ...(originEstateGeoids?.length ? { originEstateGeoids } : {}),
    ...(destinationEstateGeoids?.length ? { destinationEstateGeoids } : {}),
    onePassengerFare: positiveNumber(input.onePassengerFare, `Rule ${id} one-passenger fare`),
    ...(typeof additionalPassengerFare === "number" ? { additionalPassengerFare } : {}),
    ...(typeof perPersonFare === "number" ? { perPersonFare } : {}),
    ...(typeof input.luggageFarePerPiece !== "undefined" ? { luggageFarePerPiece: nonNegativeNumber(input.luggageFarePerPiece, `Rule ${id} luggage fare`) } : {}),
    ...(typeof input.luggageIncluded !== "undefined" ? { luggageIncluded: optionalNonNegativeInteger(input.luggageIncluded, `Rule ${id} included luggage`) } : {}),
    ...(fareConfirmationRequired ? { fareConfirmationRequired, fareConfirmationReason } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function normalizeTariffDraft(
  input: TaxiTariffDraftInput,
): Omit<OfficialTaxiTariff, "id" | "status" | "activationStatus" | "activatedAt" | "activatedBy" | "activationReviewReference"> {
  const island = requiredText(input.island, "Island") as IslandCode;
  if (!ISLANDS.includes(island)) throw new Error("Island must be St. Thomas, St. John, or St. Croix.");

  const version = requiredText(input.version, "Tariff version");
  const effectiveAt = requiredText(input.effectiveAt, "Effective date");
  if (!Number.isFinite(Date.parse(effectiveAt))) throw new Error("Effective date is invalid.");

  const sourceUrl = requiredText(input.sourceUrl, "Official source URL");
  let parsedSource: URL;
  try { parsedSource = new URL(sourceUrl); } catch { throw new Error("Official source URL is invalid."); }
  if (!["http:", "https:"].includes(parsedSource.protocol)) throw new Error("Official source URL must use HTTP or HTTPS.");

  if (!Array.isArray(input.rules) || !input.rules.length) throw new Error("At least one official route rule is required.");
  if (input.rules.length > 2000) throw new Error("A tariff cannot contain more than 2,000 route rules.");

  const rules = input.rules.map((rule, index) => normalizeRule(applyKnownTariffReviewGates(version, rule), index));
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`Duplicate rule ID: ${rule.id}.`);
    ids.add(rule.id);
  }

  return {
    title: requiredText(input.title, "Tariff title"),
    version,
    island,
    effectiveAt,
    sourceUrl: parsedSource.toString(),
    issuingAuthority: "Virgin Islands Taxicab Commission",
    currency: "USD",
    rules,
  };
}

export function assertVerifiedActiveTariff(tariff: OfficialTaxiTariff): OfficialTaxiTariff {
  normalizeTariffDraft(tariff);
  if (tariff.status !== "active") throw new Error("The selected tariff is not active.");
  if (tariff.issuingAuthority !== "Virgin Islands Taxicab Commission") throw new Error("The active tariff does not identify the required issuing authority.");
  if (tariff.currency !== "USD") throw new Error("The active tariff currency is invalid.");
  if (Date.parse(tariff.effectiveAt) > Date.now()) throw new Error("The active tariff is not effective yet.");
  if (tariff.activationStatus !== "verified" || !tariff.activatedBy || !tariff.activatedAt || !tariff.activationReviewReference) {
    throw new Error("The active tariff was not activated through the reviewed governance workflow.");
  }
  return tariff;
}
