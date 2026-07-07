import fs from "node:fs";
import path from "node:path";

const generatedPath = path.resolve("src/data/customerBookingCatalog.generated.ts");
const reportPath = path.resolve("reports/accommodation-image-audit.json");

function extractArray(text) {
  const marker = "= [";
  const startMarker = text.indexOf(marker);

  if (startMarker === -1) {
    throw new Error("Could not find generated catalog assignment.");
  }

  const start = text.indexOf("[", startMarker);
  const end = text.lastIndexOf("];");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not find generated catalog array.");
  }

  return JSON.parse(text.slice(start, end + 1));
}

function existsPublicImage(imagePath) {
  if (!imagePath) return false;
  if (/^https?:\/\//i.test(imagePath)) return true;
  if (!imagePath.startsWith("/")) return false;

  const full = path.resolve("public", imagePath.replace(/^\//, ""));
  return fs.existsSync(full);
}

function imageKind(imagePath) {
  if (/^https?:\/\//i.test(imagePath || "")) return "remote_public_candidate";
  if ((imagePath || "").includes("/_pending/")) return "pending_placeholder";
  if ((imagePath || "").startsWith("/images/accommodations/")) return "local_accommodation";
  return "other_local";
}

const text = fs.readFileSync(generatedPath, "utf8");
const records = extractArray(text);

const audit = records.map((record) => {
  const kind = imageKind(record.image);
  const imageExists = existsPublicImage(record.image);

  const status =
    kind === "remote_public_candidate"
      ? "official_public_candidate"
      : imageExists &&
          kind === "local_accommodation" &&
          ["verified", "partner_supplied"].includes(record.imageStatus)
        ? "ready"
        : imageExists && kind === "pending_placeholder"
          ? "needs_property_image"
          : !imageExists
            ? "missing_file"
            : "needs_review";

  return {
    id: record.id,
    businessName: record.businessName,
    category: record.category,
    island: record.island,
    image: record.image,
    imageKind: kind,
    imageExists,
    imageStatus: record.imageStatus || "needs_image",
    imageSourceName: record.imageSourceName || "",
    imageSourceUrl: record.imageSourceUrl || "",
    status,
  };
});

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: audit.length,
      ready: audit.filter((item) => item.status === "ready").length,
      officialPublicCandidates: audit.filter(
        (item) => item.status === "official_public_candidate"
      ).length,
      needsPropertyImage: audit.filter((item) => item.status === "needs_property_image").length,
      missingFile: audit.filter((item) => item.status === "missing_file").length,
      needsReview: audit.filter((item) => item.status === "needs_review").length,
      records: audit,
    },
    null,
    2
  )
);

console.log(`Accommodation image audit written to ${reportPath}`);
console.table({
  total: audit.length,
  ready: audit.filter((item) => item.status === "ready").length,
  officialPublicCandidates: audit.filter(
    (item) => item.status === "official_public_candidate"
  ).length,
  needsPropertyImage: audit.filter((item) => item.status === "needs_property_image").length,
  missingFile: audit.filter((item) => item.status === "missing_file").length,
  needsReview: audit.filter((item) => item.status === "needs_review").length,
});
