import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

const LOC_API_URL = "https://www.loc.gov/photos/";
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

export type LocGalleryItem = {
  id: string;
  title: string;
  date: string;
  creator: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  location: string[];
  subjects: string[];
  rights: string[];
  reproductionNumber: string;
  collection: string[];
  originalCaption: string;
  editorialNote?: string;
};

type LocSearchResult = Record<string, unknown> & {
  id?: string;
  title?: string;
  date?: string;
  contributor?: string[];
  creator?: string;
  image_url?: string[];
  url?: string;
  item?: Record<string, unknown>;
  location?: string[];
  subject?: string[];
  partof?: string[];
  rights?: string[];
};

type LocResponse = {
  results?: LocSearchResult[];
  pagination?: {
    total?: number;
    current?: number;
    next?: string | null;
    previous?: string | null;
  };
};

export async function GET(request: NextRequest) {
  const requestedPage = Number(request.nextUrl.searchParams.get("page") || "1");
  const requestedCount = Number(
    request.nextUrl.searchParams.get("count") || DEFAULT_PAGE_SIZE,
  );
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;
  const count = Number.isFinite(requestedCount)
    ? Math.min(MAX_PAGE_SIZE, Math.max(24, Math.floor(requestedCount)))
    : DEFAULT_PAGE_SIZE;

  const params = new URLSearchParams({
    q: '"Virgin Islands"',
    fa: "contributor:delano, jack",
    dates: "1941",
    fo: "json",
    at: "results,pagination",
    c: String(count),
    sp: String(page),
  });

  try {
    const response = await fetch(`${LOC_API_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VI-Guide/1.0 heritage-gallery",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "The Library of Congress collection is temporarily unavailable." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as LocResponse;
    const items = (payload.results ?? [])
      .map(normalizeLocItem)
      .filter((item): item is LocGalleryItem => Boolean(item))
      .filter(isVirginIslandsCollectionItem);

    return NextResponse.json({
      ok: true,
      collectionTitle:
        "Virgin Islands. December, 1941. St. Thomas, St. Croix, and St. Johns Islands",
      lotNumber: "LOT 31",
      physicalPrintCount: 461,
      indexedRecordCount: 452,
      page,
      pageSize: count,
      total: payload.pagination?.total ?? null,
      hasNextPage: Boolean(payload.pagination?.next),
      items,
      sourceUrl: "https://www.loc.gov/item/13655408/",
      rightsSummary:
        "The FSA/OWI black-and-white negatives are public domain. Color records in this group generally state no known restrictions; each item record remains the controlling rights source.",
    });
  } catch (error) {
    console.error("LOC Virgin Islands collection error", error);
    return NextResponse.json(
      { error: "Unable to load the Library of Congress collection." },
      { status: 500 },
    );
  }
}

function normalizeLocItem(result: LocSearchResult): LocGalleryItem | null {
  const item = result.item ?? {};
  const title = cleanText(result.title ?? item.title);
  const sourceUrl = cleanUrl(result.id ?? result.url ?? item.id);
  const imageUrls = toStringArray(result.image_url ?? item.image_url);
  const imageUrl = chooseImage(imageUrls, "large");
  const thumbnailUrl = chooseImage(imageUrls, "thumb");

  if (!title || !sourceUrl || !imageUrl) return null;

  const contributors = toStringArray(
    result.contributor ?? result.creator ?? item.contributor ?? item.creator,
  );
  const locations = uniqueStrings([
    ...toStringArray(result.location),
    ...toStringArray(item.location),
  ]);
  const subjects = uniqueStrings([
    ...toStringArray(result.subject),
    ...toStringArray(item.subject),
  ]);
  const rights = uniqueStrings([
    ...toStringArray(result.rights),
    ...toStringArray(item.rights),
    ...toStringArray(item.rights_advisory),
  ]);
  const partOf = uniqueStrings([
    ...toStringArray(result.partof),
    ...toStringArray(item.partof),
  ]);
  const reproductionNumber = cleanText(
    item.reproduction_number ?? item.reproductionNumber,
  );

  return {
    id: sourceUrl.split("/").filter(Boolean).pop() ?? sourceUrl,
    title,
    originalCaption: title,
    date: cleanText(result.date ?? item.date ?? "1941"),
    creator: contributors[0] || "Jack Delano",
    imageUrl,
    thumbnailUrl: thumbnailUrl || imageUrl,
    sourceUrl,
    location: locations,
    subjects,
    rights,
    reproductionNumber,
    collection: partOf,
    editorialNote: editorialCorrection(title),
  };
}

function isVirginIslandsCollectionItem(item: LocGalleryItem) {
  const haystack = [
    item.title,
    ...item.location,
    ...item.subjects,
    ...item.collection,
  ]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("virgin island") ||
    haystack.includes("saint thomas") ||
    haystack.includes("st. thomas") ||
    haystack.includes("saint croix") ||
    haystack.includes("st. croix") ||
    haystack.includes("saint john") ||
    haystack.includes("st. john") ||
    haystack.includes("charlotte amalie") ||
    haystack.includes("christiansted") ||
    haystack.includes("frederiksted")
  );
}

function editorialCorrection(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("old fort built by the french")) {
    return "The original agency caption incorrectly described Fort Frederik as French. The fort was built under Danish colonial rule. USVI Explorer preserves the source title while displaying this correction.";
  }
  return undefined;
}

function chooseImage(urls: string[], size: "large" | "thumb") {
  if (!urls.length) return "";
  const cleaned = urls.filter((url) => /^https:\/\//i.test(url));
  if (!cleaned.length) return "";

  if (size === "thumb") {
    return (
      cleaned.find((url) => /_150px|\.gif(?:\?|$)/i.test(url)) ??
      cleaned[0]
    );
  }

  return (
    cleaned.find((url) => /v\.jpg(?:\?|$)/i.test(url)) ??
    cleaned.find((url) => /r\.jpg(?:\?|$)/i.test(url)) ??
    cleaned.find((url) => /\.jpg(?:\?|$)/i.test(url)) ??
    cleaned[cleaned.length - 1]
  );
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => toStringArray(entry));
  }
  if (typeof value === "string") {
    const cleaned = value.trim();
    return cleaned ? [cleaned] : [];
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => toStringArray(entry));
  }
  return [];
}

function cleanText(value: unknown) {
  return toStringArray(value)[0] ?? "";
}

function cleanUrl(value: unknown) {
  const candidate = cleanText(value);
  if (!candidate) return "";
  if (candidate.startsWith("http://")) return candidate.replace("http://", "https://");
  return candidate;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
