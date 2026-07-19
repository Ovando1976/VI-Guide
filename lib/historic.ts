export function normalizeGeoText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function slugifyGeoName(value: string) {
  return normalizeGeoText(value).replace(/\s+/g, "-");
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = (value || "").trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function buildSearchTokens(parts: Array<string | null | undefined>) {
  const tokens = new Set<string>();

  for (const part of parts) {
    const raw = (part || "").trim();
    if (!raw) continue;

    const normalized = normalizeGeoText(raw);
    if (!normalized) continue;

    tokens.add(normalized);

    for (const piece of normalized.split(/\s+/)) {
      if (piece.length >= 2) {
        tokens.add(piece);
      }
    }
  }

  return [...tokens];
}
