import fs from "fs";

const OUT = "src/data/grocery.json";
const OVERPASS = "https://overpass.kumi.systems/api/interpreter";

// USVI rough bounding box: south, west, north, east
const BBOX = "17.62,-65.12,18.42,-64.55";

const queryText = `
[out:json][timeout:60];
(
  node["shop"~"supermarket|convenience|greengrocer|bakery|deli|butcher|seafood"](${BBOX});
  way["shop"~"supermarket|convenience|greengrocer|bakery|deli|butcher|seafood"](${BBOX});
  relation["shop"~"supermarket|convenience|greengrocer|bakery|deli|butcher|seafood"](${BBOX});
);
out center tags;
`;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function islandFromLngLat(lng, lat) {
  if (lat < 18.05) return "st_croix";
  if (lng > -64.86) return "st_john";
  return "st_thomas";
}

const res = await fetch(OVERPASS, {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "user-agent": "VI-Navigator data importer",
  },
  body: `data=${encodeURIComponent(queryText)}`,
});

if (!res.ok) {
  const body = await res.text();
  throw new Error(`Overpass failed: ${res.status}\n${body.slice(0, 500)}`);
}

const data = await res.json();

const seen = new Set();

const records = data.elements
  .map((el) => {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const title = tags.name;

    if (!title || typeof lat !== "number" || typeof lng !== "number") {
      return null;
    }

    const islandCode = islandFromLngLat(lng, lat);
    const slug = slugify(`${title}-${islandCode}`);

    if (seen.has(slug)) return null;
    seen.add(slug);

    return {
      id: slug,
      slug,
      title,
      category: "provisioning",
      islandCode,
      areaSlug: "grocery",
      description: `${title} is a grocery or provisioning stop in the U.S. Virgin Islands.`,
      shortDescription: "Grocery and provisioning stop.",
      coverImage: "",
      gallery: [],
      tags: ["grocery", "provisioning", tags.shop, "usvi"].filter(Boolean),
      coordinates: { lat, lng },
      address: [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"],
      ]
        .filter(Boolean)
        .join(" "),
      phone: tags.phone ?? tags["contact:phone"] ?? "",
      website: tags.website ?? tags["contact:website"] ?? "",
      osmId: `${el.type}/${el.id}`,
      source: "OpenStreetMap Overpass API",
      verifiedAt: new Date().toISOString(),
      status: "published",
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.title.localeCompare(b.title));

fs.writeFileSync(OUT, JSON.stringify(records, null, 2) + "\n");

console.log(`Wrote ${OUT}: ${records.length}`);
