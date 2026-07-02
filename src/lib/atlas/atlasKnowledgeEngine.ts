// src/lib/atlas/atlasKnowledgeEngine.ts

import type { AtlasSelection } from "../../components/maps/IslandMap";
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import { gazetteer } from "../../data/atlas/gazetteer";
import { getEstateKnowledgeForEstate } from "../../data/estateKnowledgeLookup";
import { getHistoryForEstate } from "../../data/history/historyLinks";

type LatLng = { lat: number; lng: number };

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getProperty(selection: AtlasSelection, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = selection.properties?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

function getEstateId(selection: AtlasSelection) {
  return String(
    selection.properties?.geoid ||
      selection.properties?.GEOID ||
      selection.properties?.estateId ||
      selection.properties?.id ||
      selection.id ||
      clean(selection.title),
  );
}

function sameIsland(a?: string, b?: string) {
  if (!a || !b) return true;
  return a === b || a === "all" || b === "all";
}

function matchesText(itemText: unknown[], target: string, idTarget = "") {
  const searchable = normalize(itemText.join(" "));
  return (
    (!!target && (searchable.includes(target) || target.includes(searchable))) ||
    (!!idTarget && searchable.includes(idTarget))
  );
}

function getItemLatLng(item: GeographicIndexItem): LatLng | null {
  const lat = item.coordinates?.lat ?? item.lat;
  const lng = item.coordinates?.lng ?? item.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function distanceKm(a: LatLng, b: LatLng) {
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

export function buildAtlasKnowledge(selection: AtlasSelection) {
  const estateId = getEstateId(selection);
  const cleanName = clean(selection.title);
  const target = normalize(cleanName);
  const idTarget = normalize(estateId);

  const quarter = getProperty(selection, ["quarter", "QUARTER", "quarterGroup"]);
  const estateName = getProperty(selection, ["estate", "ESTATE", "name"], cleanName);
  const parcelId = getProperty(selection, ["parcelId", "PARCELID", "parcel_id", "id"]);
  const address = getProperty(selection, ["address", "ADDRESS", "fullAddress"]);

  const estateKnowledge =
    selection.type === "estate"
      ? getEstateKnowledgeForEstate({ geoid: estateId, name: cleanName })
      : null;

  const historyRecords =
    selection.type === "estate"
      ? getHistoryForEstate({ name: cleanName, geoid: estateId, estateId }).slice(0, 8)
      : [];

  const gazetteerMatches = gazetteer
    .filter((item) => {
      if (!sameIsland(item.island, selection.island)) return false;

      return matchesText(
        [
          item.id,
          item.canonicalName,
          item.displayName,
          item.normalizedName,
          item.featureType,
          item.searchText,
          item.notes,
          ...item.aliases,
          ...item.relatedNames,
        ],
        target,
        idTarget,
      );
    })
    .slice(0, 8);

  const dictionaryMatches = geographicIndexItems
    .filter((item) => {
      if (!sameIsland(item.island, selection.island)) return false;

      return matchesText(
        [
          item.id,
          item.name,
          item.displayName,
          item.canonicalName,
          item.baseName,
          item.estateName,
          item.searchText,
          item.description,
          ...(item.aliases || []),
        ],
        target,
        idTarget,
      );
    })
    .slice(0, 8);

  const nearbyItems = geographicIndexItems
    .map((item) => {
      const coords = getItemLatLng(item);
      if (!coords || !sameIsland(item.island, selection.island)) return null;

      const km = distanceKm({ lat: selection.lat, lng: selection.lng }, coords);
      return { item, km };
    })
    .filter((entry): entry is { item: GeographicIndexItem; km: number } => {
      if (!entry) return false;
      if (entry.km <= 0.02) return false;
      return entry.km <= 3;
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 10);

  const gazetteerRelatedNames = gazetteerMatches.flatMap((item) => item.relatedNames);

  const aiContext = {
    title: selection.title,
    type: selection.type,
    island: selection.island,
    estateId,
    estateName: estateKnowledge?.estateName || estateName,
    quarter: estateKnowledge?.quarter || quarter,
    coordinates: { lat: selection.lat, lng: selection.lng },
    summary:
      estateKnowledge?.description ||
      selection.description ||
      gazetteerMatches[0]?.notes ||
      "Selected Atlas location.",
    historyCount: historyRecords.length,
    dictionaryCount: dictionaryMatches.length,
    gazetteerCount: gazetteerMatches.length,
    nearbyCount: nearbyItems.length,
    archiveCount: estateKnowledge?.relatedArchives?.length || 0,
  };

  return {
    estateId,
    cleanName,
    estateName: estateKnowledge?.estateName || estateName,
    quarter: estateKnowledge?.quarter || quarter,
    parcelId,
    address,
    estateKnowledge,
    historyRecords,
    dictionaryMatches,
    gazetteerMatches,
    nearbyItems,
    relatedPlaces: [
      ...(estateKnowledge?.relatedPlaces || []),
      ...gazetteerRelatedNames,
    ],
    relatedHistoricSites: estateKnowledge?.relatedHistoricSites || [],
    relatedArchives: estateKnowledge?.relatedArchives || [],
    aiContext,
  };
}