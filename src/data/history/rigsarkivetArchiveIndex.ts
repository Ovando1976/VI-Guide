import {
  rigsarkivetMapsAndDrawings,
  type RigsarkivetMapAndDrawing,
} from "./generated/rigsarkivetMapsAndDrawings";

export type ArchiveIsland =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island"
  | "regional"
  | "unknown";

export type ViGuideArchiveRecord = {
  id: string;
  archiveRef: string;
  title: string;
  originalTitle: string;
  englishTitle?: string;
  displayTitle?: string;
  description?: string;
  englishDescription?: string;
  island: ArchiveIsland;
  places: string[];
  yearLabel?: string;
  creator?: string;
  type: string;
  source: "Rigsarkivet";
  collection: string;
  viewerUrl: string;
  viewerItemId?: string;
  imageIds: string[];
  primaryImageId?: string;
  primaryImageUrl?: string;
  localImageUrl?: string;
  tags: string[];
  raw: RigsarkivetMapAndDrawing;
};

function slug(value: string) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeIsland(value: unknown): ArchiveIsland {
  const island = String(value || "").trim();

  if (island === "st_thomas") return "st_thomas";
  if (island === "st_john") return "st_john";
  if (island === "st_croix") return "st_croix";
  if (island === "water_island") return "water_island";
  if (island === "regional") return "regional";

  return "unknown";
}

function archiveType(title: string): string {
  const lower = title.toLowerCase();

  if (lower.includes("photograph")) return "archive_photo";
  if (lower.includes("text document")) return "archive_document";
  if (lower.includes("map")) return "historic_map";

  if (
    lower.includes("plan") ||
    lower.includes("section") ||
    lower.includes("elevation") ||
    lower.includes("floor plan") ||
    lower.includes("drawing") ||
    lower.includes("sketch") ||
    lower.includes("blueprint")
  ) {
    return "architectural_drawing";
  }

  return "archive_record";
}

function remoteImageUrl(imageId?: string) {
  if (!imageId) return undefined;
  return `https://api.rigsarkivet.dk/ao/v1/images/${imageId}`;
}

function localImagePath(record: RigsarkivetMapAndDrawing) {
  const imageId = record.imageIds?.[0];
  if (!imageId) return undefined;

  return `/images/archive/rigsarkivet/maps-and-drawings/${slug(
    record.archiveRef
  )}-${imageId}.jpg`;
}

export const rigsarkivetArchiveRecords: ViGuideArchiveRecord[] =
  rigsarkivetMapsAndDrawings.map((record) => {
    const primaryImageId = record.imageIds?.[0];
    const displayTitle = record.displayTitle || record.englishTitle || record.title;
    const originalTitle = record.originalTitle || record.title;

    return {
      id: `rigsarkivet-${slug(record.archiveRef)}-${record.viewerItemId || "item"}`,
      archiveRef: record.archiveRef,
      title: displayTitle,
      originalTitle,
      englishTitle: record.englishTitle,
      displayTitle,
      description: record.englishDescription || record.description,
      englishDescription: record.englishDescription,
      island: normalizeIsland(record.island),
      places: [...(record.places || [])],
      yearLabel: record.yearLabel,
      creator: record.creator,
      type: archiveType(displayTitle),
      source: "Rigsarkivet",
      collection:
        "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (1760–1916)",
      viewerUrl: record.viewerUrl,
      viewerItemId: record.viewerItemId,
      imageIds: [...(record.imageIds || [])],
      primaryImageId,
      primaryImageUrl: remoteImageUrl(primaryImageId),
      localImageUrl: localImagePath(record),
      tags: [...(record.tags || [])],
      raw: record,
    };
  });

export const rigsarkivetHistoricMaps = rigsarkivetArchiveRecords.filter(
  (record) => record.type === "historic_map"
);

export const rigsarkivetArchitecturalDrawings = rigsarkivetArchiveRecords.filter(
  (record) => record.type === "architectural_drawing"
);

export const rigsarkivetArchiveDocuments = rigsarkivetArchiveRecords.filter(
  (record) => record.type === "archive_document"
);

export const rigsarkivetArchivePhotos = rigsarkivetArchiveRecords.filter(
  (record) => record.type === "archive_photo"
);

export function getRigsarkivetRecordsByIsland(island: ArchiveIsland) {
  return rigsarkivetArchiveRecords.filter((record) => record.island === island);
}

export function getRigsarkivetRecordById(id: string) {
  return rigsarkivetArchiveRecords.find((record) => record.id === id);
}

export function searchRigsarkivetArchive(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rigsarkivetArchiveRecords;

  return rigsarkivetArchiveRecords.filter((record) => {
    const haystack = [
      record.archiveRef,
      record.title,
      record.originalTitle,
      record.englishTitle,
      record.displayTitle,
      record.island,
      record.creator,
      record.yearLabel,
      record.type,
      ...record.places,
      ...record.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}
