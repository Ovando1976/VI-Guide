import fs from "fs";
import path from "path";

const START_DATE = "2026-06-01";
const END_DATE = "2028-12-31";

const SOURCE_DIR = "src/data/events";
const OUT = "src/data/events.json";
const REPORT = "reports/events-calendar-report.json";

const SOURCE_FILES = [
  "annual-events.json",
  "recurring-events.json",
  "tourism-events.json",
  "festivals.json",
  "sports-events.json",
  "nightlife-events.json",
];

function readJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function inRange(dateString) {
  return dateString >= START_DATE && dateString <= END_DATE;
}

function normalizeEvent(event, sourceFile, index) {
  const slug = event.slug ?? slugify(event.title ?? `event-${index + 1}`);

  const startAtValue = event.startAt ?? event.startsAt;
  const endAtValue = event.endAt ?? event.endsAt ?? startAtValue;

  return {
    id: event.id ?? `${slug}-${startAtValue ?? "event"}`,
    slug,
    title: event.title,
    category: event.category ?? "event",
    islandCode: event.islandCode,
    areaSlug: event.areaSlug ?? "events",
    description: event.description ?? "",
    shortDescription: event.shortDescription ?? event.description ?? "",
    coordinates: event.coordinates,
    address: event.address ?? "",
    website: event.website ?? "",
    source: event.source ?? sourceFile,
    sourceStatus: event.sourceStatus ?? "manual_verified",
    verifiedAt: event.verifiedAt ?? new Date().toISOString().slice(0, 10),

    startAt: new Date(`${startAtValue}T12:00:00Z`).getTime(),
    endAt: new Date(`${endAtValue}T12:00:00Z`).getTime(),

    coverImage: event.coverImage ?? "",
    gallery: event.gallery ?? (event.coverImage ? [event.coverImage] : []),
    tags: event.tags ?? ["event", "usvi"],
    status: event.status ?? "published",
    createdAt: event.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
}

function expandAnnual(event, sourceFile, index) {
  const records = [];

  for (const year of [2026, 2027, 2028]) {
    const startsAt = event.startsAt?.replace("YYYY", String(year));
    const endsAt = event.endsAt?.replace("YYYY", String(year)) ?? startsAt;

    if (!startsAt || !inRange(startsAt)) continue;

    records.push(
      normalizeEvent(
        {
          ...event,
          slug: `${event.slug ?? slugify(event.title)}-${year}`,
          title: event.title.includes(String(year))
            ? event.title
            : `${event.title} ${year}`,
          startsAt,
          endsAt,
          sourceStatus: event.sourceStatus ?? "projected_annual",
        },
        sourceFile,
        index
      )
    );
  }

  return records;
}

function expandRecurring(event, sourceFile, index) {
  const records = [];

  const weekdays = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const weekday = weekdays[String(event.weekday ?? "").toLowerCase()];
  if (weekday === undefined) return records;

  let cursor = toDate(event.startDate ?? START_DATE);
  const end = toDate(event.endDate ?? END_DATE);
  if (!cursor || !end) return records;

  while (dateKey(cursor) <= dateKey(end)) {
    const key = dateKey(cursor);

    if (cursor.getUTCDay() === weekday && inRange(key)) {
      records.push(
        normalizeEvent(
          {
            ...event,
            slug: `${event.slug ?? slugify(event.title)}-${key}`,
            title: event.title,
            startsAt: key,
            endsAt: key,
            sourceStatus: event.sourceStatus ?? "recurring_rule",
          },
          sourceFile,
          index
        )
      );
    }

    cursor = addDays(cursor, 1);
  }

  return records;
}

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.mkdirSync("reports", { recursive: true });

for (const file of SOURCE_FILES) {
  const fullPath = path.join(SOURCE_DIR, file);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "[]\n");
    console.log(`Created ${fullPath}`);
  }
}

const allEvents = [];
const report = [];

for (const file of SOURCE_FILES) {
  const fullPath = path.join(SOURCE_DIR, file);
  const rows = readJson(fullPath);

  for (const [index, event] of rows.entries()) {
    if (event.recurrence === "annual") {
      allEvents.push(...expandAnnual(event, file, index));
    } else if (event.recurrence === "weekly") {
      allEvents.push(...expandRecurring(event, file, index));
    } else {
      const normalized = normalizeEvent(event, file, index);
      if (normalized.startsAt && inRange(normalized.startsAt)) {
        allEvents.push(normalized);
      }
    }
  }

  report.push({ file, sourceRecords: rows.length });
}

const seen = new Set();
const deduped = allEvents
  .filter((event) => {
    const key = `${event.slug}-${event.startsAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

const invalid = deduped.filter(
  (event) =>
    !event.title ||
    !event.islandCode ||
    !event.startAt ||
    !event.coordinates?.lat ||
    !event.coordinates?.lng ||
    !event.source ||
    !event.verifiedAt
);

if (invalid.length) {
  console.error("Invalid events:");
  for (const event of invalid.slice(0, 50)) {
    console.error(`- ${event.title ?? event.slug}`);
  }
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(deduped, null, 2) + "\n");
fs.writeFileSync(
  REPORT,
  JSON.stringify(
    {
      range: { start: START_DATE, end: END_DATE },
      sourceFiles: report,
      outputRecords: deduped.length,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + "\n"
);

console.log(`Built ${OUT}`);
console.log(`Events: ${deduped.length}`);
console.log(`Report: ${REPORT}`);
