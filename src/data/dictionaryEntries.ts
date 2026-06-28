import rawDictionary from "./vi-dictionary.json";

export type DictionaryEntry = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  island?: string;
  islands?: string[];
  island_codes?: string[];
  quarter?: string;
  description?: string;
  aliases?: string[];
  latitude?: number;
  longitude?: number;
  coordinates?: any;
  source?: string;
  slug?: string;
  search_text?: string;
};

export const dictionaryEntries = rawDictionary as DictionaryEntry[];

export function islandToCode(value?: string | null) {
  const v = String(value ?? "").toLowerCase();

  if (v.includes("thomas") || v === "stt") return "stt";
  if (v.includes("john") || v === "stj") return "stj";
  if (v.includes("croix") || v === "stx") return "stx";
  if (v.includes("water") || v === "wat") return "wat";

  return null;
}

export function getEntryIslandLabel(entry: DictionaryEntry) {
  if (entry.island) return entry.island;
  if (entry.islands?.length) return entry.islands.join(", ");
  if (entry.island_codes?.length) return entry.island_codes.join(", ");
  return "Virgin Islands";
}

export function getDictionaryEntryById(id: string) {
  return dictionaryEntries.find((entry) => entry.id === id);
}

export function searchDictionaryEntries(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return dictionaryEntries;

  return dictionaryEntries.filter((entry) => {
    const text =
      entry.search_text ||
      [
        entry.id,
        entry.name,
        entry.type,
        entry.category,
        entry.island,
        ...(entry.islands || []),
        ...(entry.island_codes || []),
        entry.quarter,
        entry.description,
        ...(entry.aliases || []),
      ]
        .filter(Boolean)
        .join(" ");

    return text.toLowerCase().includes(q);
  });
}