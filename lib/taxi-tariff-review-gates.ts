import type { TaxiFareConfirmationScope } from "@/types/taxi-operations";

const STT_DRAFT_VERSION = "vicc-2022-10-24-stta-2026-web-v1";

type CandidateAliasGate = {
  canonicalSourceName: string;
  candidateAlias: string;
};

type FareConfirmationGate = {
  ruleId: string;
  scope: TaxiFareConfirmationScope;
  reason: string;
};

const candidateAliasGates: CandidateAliasGate[] = [
  { canonicalSourceName: "Town", candidateAlias: "Charlotte Amalie" },
  { canonicalSourceName: "Airport Terminal", candidateAlias: "Lindbergh Bay" },
  { canonicalSourceName: "Dorotdea Estate", candidateAlias: "Dorothea Estate" },
  { canonicalSourceName: "Dorothea", candidateAlias: "Dorothea Estate" },
  {
    canonicalSourceName: "Estate tdomas New Qtr",
    candidateAlias: "Estate Thomas New Quarter",
  },
];

const fareConfirmationGates: FareConfirmationGate[] = [
  {
    ruleId: "misc-red-hook-to-dorothea",
    scope: "two_or_more",
    reason:
      "St. Thomas Taxi Association publishes $15 per person for 2+ while VInow publishes $16. Commission confirmation is required before activation or automatic 2+ quoting.",
  },
];

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function moveCandidateAlias(
  names: string[],
  existingCandidates: string[],
  gate: CandidateAliasGate,
) {
  const hasCanonical = names.some(
    (name) =>
      normalizeComparable(name) === normalizeComparable(gate.canonicalSourceName),
  );
  if (!hasCanonical) return { names, candidates: existingCandidates };

  const aliasKey = normalizeComparable(gate.candidateAlias);
  const nextNames = names.filter(
    (name) => normalizeComparable(name) !== aliasKey,
  );
  if (nextNames.length === names.length) {
    return { names, candidates: existingCandidates };
  }

  const nextCandidates = existingCandidates.some(
    (candidate) => normalizeComparable(candidate) === aliasKey,
  )
    ? existingCandidates
    : [...existingCandidates, gate.candidateAlias];

  return { names: nextNames, candidates: nextCandidates };
}

export function applyKnownTariffReviewGates(
  version: string,
  value: unknown,
): unknown {
  if (version !== STT_DRAFT_VERSION) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const input = value as Record<string, unknown>;
  let originNames = asStringList(input.originNames);
  let destinationNames = asStringList(input.destinationNames);
  let originCandidateAliases = asStringList(input.originCandidateAliases);
  let destinationCandidateAliases = asStringList(
    input.destinationCandidateAliases,
  );

  for (const gate of candidateAliasGates) {
    const originResult = moveCandidateAlias(
      originNames,
      originCandidateAliases,
      gate,
    );
    originNames = originResult.names;
    originCandidateAliases = originResult.candidates;

    const destinationResult = moveCandidateAlias(
      destinationNames,
      destinationCandidateAliases,
      gate,
    );
    destinationNames = destinationResult.names;
    destinationCandidateAliases = destinationResult.candidates;
  }

  const id = typeof input.id === "string" ? input.id : "";
  const fareGate = fareConfirmationGates.find((gate) => gate.ruleId === id);

  return {
    ...input,
    originNames,
    destinationNames,
    ...(originCandidateAliases.length ? { originCandidateAliases } : {}),
    ...(destinationCandidateAliases.length
      ? { destinationCandidateAliases }
      : {}),
    ...(fareGate
      ? {
          fareConfirmationRequired: fareGate.scope,
          fareConfirmationReason: fareGate.reason,
        }
      : {}),
  };
}
