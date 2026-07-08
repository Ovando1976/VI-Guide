import fs from "fs";

const SOURCE = "src/data/events-source.json";
const OUT = "src/data/events.json";

if (!fs.existsSync(SOURCE)) {
  fs.writeFileSync(SOURCE, JSON.stringify([], null, 2) + "\n");
  console.log(`Created ${SOURCE}. Add verified official event records there first.`);
  process.exit(0);
}

const rows = JSON.parse(fs.readFileSync(SOURCE, "utf8"));

const clean = rows.map((e, i) => ({
  id: e.id ?? e.slug ?? `event-${i + 1}`,
  slug: e.slug ?? String(e.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  title: e.title,
  category: "event",
  islandCode: e.islandCode,
  areaSlug: e.areaSlug ?? "events",
  description: e.description ?? "",
  shortDescription: e.shortDescription ?? e.description ?? "",
  coverImage: e.coverImage ?? "",
  gallery: e.gallery ?? (e.coverImage ? [e.coverImage] : []),
  tags: e.tags ?? ["event", "usvi"],
  coordinates: e.coordinates,
  address: e.address ?? "",
  website: e.website ?? "",
  startsAt: e.startsAt ?? null,
  endsAt: e.endsAt ?? null,
  source: e.source,
  verifiedAt: e.verifiedAt ?? new Date().toISOString(),
  status: "published",
}));

const bad = clean.filter(e => !e.title || !e.islandCode || !e.coordinates?.lat || !e.coordinates?.lng || !e.source);

if (bad.length) {
  console.error("Invalid event records:", bad.map(e => e.title || e.id));
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(clean, null, 2) + "\n");
console.log(`Wrote ${OUT}: ${clean.length}`);
