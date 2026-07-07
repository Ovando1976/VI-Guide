import fs from "node:fs";
import path from "node:path";

const input = path.resolve("imports/usvi-accommodations-catalog.csv");
const output = path.resolve("src/data/customerBookingCatalog.generated.ts");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      quoted = !quoted;
      continue;
    }

    if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  return rows;
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const raw = fs.readFileSync(input, "utf8");
const [headers, ...rows] = parseCsv(raw);

const records = rows.map((row) => {
  const item = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
  const id = slug(`${item.island}-${item.category}-${item.businessName}`);

  return {
    id,
    businessName: item.businessName.trim(),
    category: item.category.trim(),
    island: item.island.trim(),
    area: item.area.trim(),
    headline: item.headline.trim(),
    description: item.description.trim(),
    bestFor: item.bestFor.split("|").map((tag) => tag.trim()).filter(Boolean),
    bookingOffer: item.bookingOffer.trim(),
    mobilityNote: item.mobilityNote.trim(),
    image: item.image.trim() || "/images/places/st-thomas/magens-bay-beach-1.jpg",
    website: item.website.trim() || undefined,
    phone: item.phone.trim() || undefined,
    sourceName: item.sourceName.trim() || "Manual verification queue",
    sourceUrl: item.sourceUrl.trim() || undefined,
    lastVerified: item.lastVerified.trim() || "needs_review",
    inventoryScope: item.inventoryScope.trim() || "single_property",
    verificationStatus: item.verificationStatus.trim() || "needs_review",
  };
});

const body = `import type { CustomerBookingRecord } from "./customerBookingCatalog";

export const generatedCustomerBookingCatalog: CustomerBookingRecord[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(output, body);
console.log(`Generated ${records.length} booking records -> ${output}`);
