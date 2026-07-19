import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Attribution = { displayName?: string; uri?: string; photoUri?: string };
type PlacePhoto = { name?: string; authorAttributions?: Attribution[] };
type PlaceResult = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  photos?: PlacePhoto[];
};

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId")?.trim();
  const queryText = request.nextUrl.searchParams.get("query")?.trim();
  const island = request.nextUrl.searchParams.get("island")?.trim();
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!placeId && !queryText) return NextResponse.json({ error: "placeId or query is required." }, { status: 400 });
  if (!key) return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });

  let photo: PlacePhoto | undefined;
  let matchedName = "";

  if (placeId) {
    const details = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        cache: "no-store",
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "displayName,photos",
        },
      },
    );
    const payload = await details.json().catch(() => ({})) as PlaceResult;
    photo = payload.photos?.[0];
    matchedName = payload.displayName?.text ?? "";
  }

  // Some valid legacy listings contain no photos, while a current listing for
  // the same named location does. Search only after the verified ID fails.
  if (!photo?.name && queryText) {
    const result = await searchForPhoto(key, queryText, island);
    photo = result?.photos?.[0];
    matchedName = result?.displayName?.text ?? "";
  }

  if (!photo?.name) {
    return NextResponse.json({ error: "No verified Google Places photo is available." }, { status: 404 });
  }

  const media = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&skipHttpRedirect=true`,
    { cache: "no-store", headers: { "X-Goog-Api-Key": key } },
  );
  const mediaPayload = await media.json().catch(() => ({})) as {
    photoUri?: string;
    error?: { message?: string };
  };
  if (!media.ok || !mediaPayload.photoUri) {
    return NextResponse.json(
      { error: mediaPayload.error?.message || "The Google Places photo could not be loaded." },
      { status: media.ok ? 404 : media.status },
    );
  }

  return NextResponse.json(
    {
      photoUri: mediaPayload.photoUri,
      matchedName,
      attributions: (photo.authorAttributions ?? []).map((attribution) => ({
        displayName: attribution.displayName ?? "Google Maps contributor",
        uri: attribution.uri ?? "",
      })),
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

async function searchForPhoto(key: string, queryText: string, island?: string) {
  const resolved = canonicalSearch(queryText, island);
  const islandName = islandLabel(resolved.island);
  const searchText = [resolved.query, islandName, "U.S. Virgin Islands"].filter(Boolean).join(", ");
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.photos",
    },
    body: JSON.stringify({ textQuery: searchText, pageSize: 5 }),
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({})) as { places?: PlaceResult[] };
  const candidates = (payload.places ?? []).filter((place) => place.photos?.[0]?.name);
  return candidates
    .map((place) => ({ place, score: matchScore(resolved.query, place, resolved.island) }))
    .filter(({ score }) => score >= 0.44)
    .sort((a, b) => b.score - a.score)[0]?.place ?? null;
}

function canonicalSearch(queryText: string, island?: string) {
  const key = queryText.toLowerCase();
  if (key.includes("bluebeard") && key.includes("frenchman")) return { query: "Bluebeard's Castle", island: "STT" };
  if (key.includes("lockhart gardens") && key.includes("tutu park")) return { query: "Lockhart Gardens Shopping Center", island: "STT" };
  if (key.includes("st. croix timeshares") || key.includes("chenay bay beach resort")) return { query: "Chenay Bay Beach Resort", island: "STX" };
  if (key.includes("ritz-carlton club")) return { query: "The Ritz-Carlton Club St. Thomas", island: "STT" };
  if (key.includes("havensight shopping mall")) return { query: "Havensight Mall", island: "STT" };
  return { query: queryText, island };
}

function matchScore(queryText: string, place: PlaceResult, island?: string) {
  const expected = tokens(queryText);
  const actual = tokens(place.displayName?.text ?? "");
  const overlap = expected.length ? expected.filter((token) => actual.includes(token)).length / expected.length : 0;
  const address = (place.formattedAddress ?? "").toLowerCase();
  const territory = /virgin islands|\bvi\b|\busvi\b/.test(address) ? 0.18 : 0;
  const islandName = islandLabel(island).toLowerCase();
  const islandMatch = islandName && address.includes(islandName) ? 0.12 : 0;
  return overlap * 0.7 + territory + islandMatch;
}

function tokens(value: string) {
  const ignored = new Set(["and", "the", "at", "of", "club", "resort", "hotel", "beach", "timeshare", "timeshares"]);
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 2 && !ignored.has(token));
}

function islandLabel(value?: string) {
  const key = (value ?? "").toUpperCase();
  if (key === "STT") return "St. Thomas";
  if (key === "STJ") return "St. John";
  if (key === "STX") return "St. Croix";
  return "";
}
