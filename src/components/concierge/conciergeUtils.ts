import type { IslandCode } from "../../types";

export type BookingOption = "tour" | "ride" | "bundle";

export function normalizeIsland(value?: string | null): IslandCode {
  if (value === "stt" || value === "st_thomas") return "st_thomas";
  if (value === "stj" || value === "st_john") return "st_john";
  if (value === "stx" || value === "st_croix") return "st_croix";
  if (value === "wat" || value === "water_island") return "water_island";
  return "st_thomas";
}

export function islandLabel(value?: string | null): string {
  const island = normalizeIsland(value);
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  return "Water Island";
}

export function inferBookingOption(text: string): BookingOption {
  const lower = text.toLowerCase();
  if (lower.includes("bundle") || (lower.includes("tour") && lower.includes("ride"))) return "bundle";
  if (lower.includes("ride") || lower.includes("taxi") || lower.includes("pickup") || lower.includes("drive") || lower.includes("transport")) return "ride";
  return "tour";
}

export function wantsBooking(text: string) {
  const lower = text.toLowerCase();
  return ["book", "reserve", "tour", "bundle", "schedule", "price"].some((word) => lower.includes(word));
}

export function extractLeadDetails(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = text.match(/(?:\+?1[-.\s]?)?(?:\(?340\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/)?.[0] ?? null;
  const guestMatch = text.match(/(?:party of|guests?|people|persons?|for)\s+(\d{1,2})/i) || text.match(/(\d{1,2})\s+(?:guests?|people|persons?)/i);
  const dateMatch = text.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[^,.]*/i)?.[0] ?? null;
  const pickupMatch = text.match(/(?:pickup|pick up|from)\s+(?:at\s+)?([^,.]+)/i)?.[1]?.trim() ?? null;

  return {
    customerEmail: email,
    customerPhone: phone,
    guestCount: guestMatch ? Number(guestMatch[1]) : null,
    preferredDate: dateMatch,
    pickupLocation: pickupMatch,
    specialRequests: text.trim() || null,
  };
}

export function extractPlaceQueries(text: string): string[] {
  const cleaned = text
    .replace(/\bhow do i get to\b/gi, "")
    .replace(/\bhow do i get\b/gi, "")
    .replace(/\bhow to get to\b/gi, "")
    .replace(/\bwhere is\b/gi, "")
    .replace(/\btoo\b/gi, "to")
    .replace(/\bfrom\b/gi, "|")
    .replace(/\bto\b/gi, "|")
    .replace(/[?.,]/g, " ");

  return cleaned.split("|").map((part) => part.trim()).filter((part) => part.length >= 3);
}

export async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Request timed out")), ms);
    }),
  ]);
}
