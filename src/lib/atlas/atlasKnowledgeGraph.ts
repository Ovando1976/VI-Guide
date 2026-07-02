import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import { getEstateKnowledgeForEstate } from "../../data/estateKnowledgeLookup";
import { getHistoryForEstate } from "../../data/history/historyLinks";

export type AtlasKnowledgeNode = {
  id: string;
  title: string;
  type: string;
  island?: string;
  summary?: string;
  estateKnowledge?: ReturnType<typeof getEstateKnowledgeForEstate>;
  dictionaryMatches: GeographicIndexItem[];
  historyRecords: ReturnType<typeof getHistoryForEstate>;
  nearbyPlaces: GeographicIndexItem[];
};

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCoords(item: GeographicIndexItem) {
  const lat = item.coordinates?.lat ?? item.lat;
  const lng = item.coordinates?.lng ?? item.lng;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * r * Math.asin(Math.sqrt(h));
}

function dictionaryMatchesFor(item: GeographicIndexItem) {
  const target = normalize(item.name);
  const estateTarget = normalize(item.estateName);
  const idTarget = normalize(item.estateId || item.id);

  return geographicIndexItems
    .filter((candidate) => {
      const text = normalize(
        [
          candidate.id,
          candidate.name,
          candidate.displayName,
          candidate.canonicalName,
          candidate.baseName,
          candidate.estateName,
          candidate.searchText,
          candidate.description,
          ...(candidate.aliases || []),
        ].join(" "),
      );

      return (
        text.includes(target) ||
        (!!estateTarget && text.includes(estateTarget)) ||
        (!!idTarget && text.includes(idTarget))
      );
    })
    .slice(0, 12);
}

function nearbyFor(item: GeographicIndexItem) {
  const origin = getCoords(item);
  if (!origin) return [];

  return geographicIndexItems
    .map((candidate) => {
      const coords = getCoords(candidate);
      if (!coords || candidate.id === item.id) return null;

      return {
        item: candidate,
        km: distanceKm(origin, coords),
      };
    })
    .filter((entry): entry is { item: GeographicIndexItem; km: number } => {
      if (!entry) return false;
      if (entry.km <= 0.02) return false;
      return entry.km <= 5;
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 12)
    .map((entry) => entry.item);
}

export function buildAtlasKnowledgeNode(
  item: GeographicIndexItem,
): AtlasKnowledgeNode {
  const title = clean(item.displayName || item.name);
  const estateId = String(item.estateId || item.geoid || item.id || title);

  const estateKnowledge =
    item.source === "estate" || item.type === "estate"
      ? getEstateKnowledgeForEstate({
          geoid: estateId,
          name: title,
        })
      : null;

  const historyRecords =
    item.source === "estate" || item.type === "estate"
      ? getHistoryForEstate({
          name: title,
          geoid: estateId,
          estateId,
        })
      : [];

  return {
    id: item.id,
    title,
    type: item.type || item.category || item.source || "atlas-item",
    island: item.island,
    summary:
      estateKnowledge?.description ||
      item.description ||
      `${title} is connected to the VI Guide atlas.`,
    estateKnowledge,
    dictionaryMatches: dictionaryMatchesFor(item),
    historyRecords,
    nearbyPlaces: nearbyFor(item),
  };
}