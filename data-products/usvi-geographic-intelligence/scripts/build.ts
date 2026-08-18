function uniqueSorted(values: unknown[]): string[] {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function pointStatus(point: Point | null | undefined): AuditRow["coordinate_status"] {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return "MISSING";
  // Broad territory guardrail, intentionally wider than individual island extents.
  if (point.lat < 17.5 || point.lat > 18.5 || point.lng < -65.2 || point.lng > -64.4) {
    return "OUT_OF_BOUNDS";
  }
  return "OK";
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n") + "\n";
}

function classify(
  estate: EnrichedEstate,
  duplicateKeys: Set<string>,
  reviewByGeoid: Map<string, ReviewCandidate[]>,
): { status: AuditStatus; reason: string; confidence: AuditRow["confidence"] } {
  const key = `${estate.island}:${normalize(estate.baseName)}:${estate.geoid}`;
  if (duplicateKeys.has(key)) {
    return { status: "DUPLICATE", reason: "Multiple modern estates share the same normalized island/name/GEOID identity key.", confidence: "low" };
  }

  const pending = reviewByGeoid.get(estate.geoid) ?? [];
  if (pending.length) {
    return {
      status: "NEEDS_REVIEW",
      reason: pending.map((item) => `${item.reason ?? "review"}:${item.dictionaryEntry?.name ?? "unknown"}`).join(" | "),
      confidence: "low",
    };
  }

  const matches = estate.dictionaryMatches ?? [];
  if (!matches.length) {
    return { status: "MISSING", reason: "No Geographic Dictionary match is attached to this modern estate.", confidence: "medium" };
  }

  const modern = normalize(estate.baseName);
  const exact = matches.some((match) => normalize(match.name ?? match.normalizedName) === modern);
  if (exact) return { status: "MATCHED", reason: "Modern estate name has an exact normalized dictionary match.", confidence: "high" };

  const aliases = new Set((estate.aliases ?? []).map(normalize));
  const aliasMatch = matches.some((match) => aliases.has(normalize(match.name ?? match.normalizedName)));
  if (aliasMatch) return { status: "ALIAS", reason: "Dictionary name resolves through the estate alias set.", confidence: "high" };

  if (matches.length > 1) {
    return { status: "CONFLICT", reason: "Multiple non-exact dictionary matches remain attached to this estate.", confidence: "low" };
  }

  return { status: "ALIAS", reason: "Single non-exact historical/dictionary name is attached to the modern estate.", confidence: "medium" };
}

function isBlocking(row: AuditRow): boolean {
  return (
    row.match_type === "DUPLICATE" ||
    row.match_type === "CONFLICT" ||
    row.match_type === "NEEDS_REVIEW" ||
    row.coordinate_status !== "OK" ||
    row.geometry_status !== "OK" ||
    row.provenance_status !== "OK"
  );
}

async function main() {
  const [estateRaw, reviewRaw] = await Promise.all([
    readFile(SOURCE_PATH, "utf8"),
    readFile(REVIEW_PATH, "utf8"),
  ]);
  const estates = JSON.parse(estateRaw) as EnrichedEstate[];
  const reviews = JSON.parse(reviewRaw) as ReviewCandidate[];

  const identityCounts = new Map<string, number>();
  for (const estate of estates) {
    const key = `${estate.island}:${normalize(estate.baseName)}:${estate.geoid}`;
    identityCounts.set(key, (identityCounts.get(key) ?? 0) + 1);
  }