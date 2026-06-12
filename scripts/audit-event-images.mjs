import fs from "fs";
import path from "path";

const EVENTS_FILE = "src/data/events.json";
const PUBLIC_DIR = "public";

if (!fs.existsSync(EVENTS_FILE)) {
  console.error(`Missing ${EVENTS_FILE}`);
  process.exit(1);
}

const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));

const missing = [];
const placeholders = [];
const review = [];

for (const event of events) {
  if (!event.coverImage) {
    missing.push({ title: event.title, slug: event.slug, reason: "No coverImage" });
    continue;
  }

  if (event.coverImage.startsWith("http")) {
    review.push({ title: event.title, slug: event.slug, image: event.coverImage, reason: "Remote image" });
    continue;
  }

  const filePath = path.join(PUBLIC_DIR, event.coverImage.replace(/^\//, ""));

  if (!fs.existsSync(filePath)) {
    missing.push({ title: event.title, slug: event.slug, image: event.coverImage, reason: "Missing file" });
  }

  if (
    event.coverImage.includes("picsum") ||
    event.coverImage.includes("placeholder") ||
    event.coverImage.includes("default")
  ) {
    placeholders.push({ title: event.title, slug: event.slug, image: event.coverImage });
  }

  if (
    event.imageStatus === "needs_manual_review" ||
    event.sourceStatus === "needs_verification"
  ) {
    review.push({
      title: event.title,
      slug: event.slug,
      image: event.coverImage,
      sourceStatus: event.sourceStatus,
      imageStatus: event.imageStatus ?? "unset",
    });
  }
}

console.log("Event Image Audit");
console.log("=================");
console.log(`Events: ${events.length}`);
console.log(`Missing images: ${missing.length}`);
console.log(`Placeholder images: ${placeholders.length}`);
console.log(`Needs review: ${review.length}`);

if (missing.length) {
  console.log("\nMissing image files:");
  missing.slice(0, 50).forEach((item) => {
    console.log(`- ${item.title}: ${item.image ?? item.reason}`);
  });
}

if (placeholders.length) {
  console.log("\nPlaceholder images:");
  placeholders.slice(0, 50).forEach((item) => {
    console.log(`- ${item.title}: ${item.image}`);
  });
}

if (review.length) {
  console.log("\nNeeds manual review:");
  review.slice(0, 50).forEach((item) => {
    console.log(`- ${item.title}: ${item.image}`);
  });
}

if (missing.length || placeholders.length) {
  process.exit(1);
}
