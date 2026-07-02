import type { IslandCode } from "../../types";

export type ConciergeIntentType =
  | "history"
  | "dictionary"
  | "nearby_beaches"
  | "nearby_places"
  | "directions"
  | "taxi"
  | "archives"
  | "businesses"
  | "events"
  | "general";

export type ParsedConciergeIntent = {
  intent: ConciergeIntentType;
  entities: string[];
  origin?: string;
  destination?: string;
  island: IslandCode;
  raw: string;
};

export function parseConciergeIntent(input: {
  message: string;
  island: IslandCode;
}): ParsedConciergeIntent {
  const raw = input.message.trim();
  const text = raw.toLowerCase();

  const routeMatch =
    raw.match(/(?:from)\s+(.+?)\s+(?:to)\s+(.+?)[?.]?$/i) ||
    raw.match(/(?:to)\s+(.+?)\s+(?:from)\s+(.+?)[?.]?$/i);

  if (
    text.includes("taxi") ||
    text.includes("ride") ||
    text.includes("fare") ||
    text.includes("pickup")
  ) {
    return {
      intent: "taxi",
      entities: extractEntities(raw),
      origin: routeMatch?.[1]?.trim(),
      destination: routeMatch?.[2]?.trim(),
      island: input.island,
      raw,
    };
  }

  if (
    text.includes("how do i get") ||
    text.includes("directions") ||
    text.includes("route") ||
    text.includes("drive")
  ) {
    return {
      intent: "directions",
      entities: extractEntities(raw),
      origin: routeMatch?.[1]?.trim(),
      destination: routeMatch?.[2]?.trim(),
      island: input.island,
      raw,
    };
  }

  if (text.includes("history") || text.includes("historic")) {
    return {
      intent: "history",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (text.includes("dictionary") || text.includes("meaning") || text.includes("record")) {
    return {
      intent: "dictionary",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (text.includes("archive") || text.includes("archives") || text.includes("document")) {
    return {
      intent: "archives",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (text.includes("beach") || text.includes("beaches") || text.includes("snorkel")) {
    return {
      intent: "nearby_beaches",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (
    text.includes("restaurant") ||
    text.includes("food") ||
    text.includes("lunch") ||
    text.includes("dinner") ||
    text.includes("business")
  ) {
    return {
      intent: "businesses",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (text.includes("event") || text.includes("tonight") || text.includes("today")) {
    return {
      intent: "events",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  if (text.includes("near") || text.includes("nearby") || text.includes("around")) {
    return {
      intent: "nearby_places",
      entities: extractEntities(raw),
      island: input.island,
      raw,
    };
  }

  return {
    intent: "general",
    entities: extractEntities(raw),
    island: input.island,
    raw,
  };
}

function extractEntities(text: string) {
  const raw = text.trim();

  const estateMatch = raw.match(/estate\s+([a-z0-9'’&.\-\s]+)/i);
  if (estateMatch?.[1]) {
    return [`Estate ${estateMatch[1].replace(/[?.,]/g, " ").trim()}`];
  }

  const cleaned = raw
    .replace(/\bhow do i get to\b/gi, "")
    .replace(/\bhow do i get\b/gi, "")
    .replace(/\btell me\b/gi, "")
    .replace(/\bshow me\b/gi, "")
    .replace(/\bwhat dictionary records are connected to\b/gi, "")
    .replace(/\bwhat beaches are near\b/gi, "")
    .replace(/\btell me the history of\b/gi, "")
    .replace(/\bhistory of\b/gi, "")
    .replace(/\bnear\b/gi, "|")
    .replace(/\bfrom\b/gi, "|")
    .replace(/\bto\b/gi, "|")
    .replace(/[?.,]/g, " ");

  return cleaned
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
}