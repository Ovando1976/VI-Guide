import { createHash } from "node:crypto";

export function socialNow() {
  return new Date().toISOString();
}

export function cleanSocialText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function cleanOptionalSocialText(value: unknown, maxLength: number) {
  const cleaned = cleanSocialText(value, maxLength);
  return cleaned || null;
}

export function normalizeHandle(value: unknown) {
  return cleanSocialText(value, 40)
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

export function normalizeSearch(value: unknown) {
  return cleanSocialText(value, 80).toLowerCase();
}

export function socialHash(...parts: string[]) {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

export function socialPairId(left: string, right: string): string;
export function socialPairId(prefix: string, left: string, right: string): string;
export function socialPairId(prefixOrLeft: string, leftOrRight: string, maybeRight?: string) {
  const hasPrefix = maybeRight !== undefined;
  const prefix = hasPrefix ? prefixOrLeft : null;
  const left = hasPrefix ? leftOrRight : prefixOrLeft;
  const right = hasPrefix ? maybeRight : leftOrRight;
  const [a, b] = [left, right].sort();
  const pairHash = socialHash(a, b).slice(0, 32);
  return prefix ? `${prefix}_${pairHash}` : pairHash;
}

export function socialRelationId(prefix: string, actorId: string, targetId: string) {
  return `${prefix}_${socialHash(actorId, targetId).slice(0, 32)}`;
}

export function safeSocialId(value: unknown, label = "id") {
  const id = cleanSocialText(value, 160);
  if (!id || !/^[a-zA-Z0-9_:-]{1,160}$/.test(id)) {
    throw new Error(`Invalid social ${label}.`);
  }
  return id;
}

export function uniqueStrings(values: unknown, limit = 20, maxLength = 40) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => cleanSocialText(value, maxLength))
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

export function searchPrefixes(...values: Array<string | null | undefined>) {
  const prefixes = new Set<string>();
  for (const raw of values) {
    const normalized = normalizeSearch(raw ?? "");
    if (!normalized) continue;
    for (const token of normalized.split(/\s+/g)) {
      for (let length = 1; length <= Math.min(token.length, 20); length += 1) {
        prefixes.add(token.slice(0, length));
        if (prefixes.size >= 80) return Array.from(prefixes);
      }
    }
    for (let length = 1; length <= Math.min(normalized.length, 24); length += 1) {
      prefixes.add(normalized.slice(0, length));
      if (prefixes.size >= 80) return Array.from(prefixes);
    }
  }
  return Array.from(prefixes);
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item === undefined) continue;
      output[key] = stripUndefined(item);
    }
    return output as T;
  }
  return value;
}

export function boundedSocialLimit(value: unknown, fallback = 25, max = 50) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(Math.floor(parsed), max));
}
