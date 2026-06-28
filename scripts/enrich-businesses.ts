import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATABASE_ID = "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671";

const serviceAccount = JSON.parse(
  readFileSync(".secrets/firebase-admin.json", "utf8"),
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app, DATABASE_ID);

function cleanName(name: string) {
  return name
    .replace(/\bIN\b/g, "in")
    .replace(/\bAT\b/g, "at")
    .replace(/\bAND\b/g, "and")
    .replace(/\bST John\b/g, "St. John")
    .replace(/\bST Thomas\b/g, "St. Thomas")
    .replace(/\bST Croix\b/g, "St. Croix")
    .replace(/\bStx\b/g, "STX")
    .replace(/\bStt\b/g, "STT")
    .replace(/\bCafe\b/g, "Café")
    .replace(/\bCaf(?!é)\b/g, "Café")
    .replace(/Caféé/g, "Café")
    .replace(/\bBbq\b/g, "BBQ")
    .replace(/\bS\b/g, "'s")
    .replace(/\s+/g, " ")
    .replace(/\s+'/g, "'")
    .trim();
}

function label(value?: string) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/-/g, " ");
}

function isGenericDescription(description: string, name: string) {
  const lower = description.toLowerCase();

  return (
    !description.trim() ||
    lower.includes("is a restaurant destination") ||
    lower.includes("is a grocery or provisioning stop") ||
    lower.includes("is a local") ||
    lower === `${name.toLowerCase()} is a restaurant destination in the u.s. virgin islands.`
  );
}

function makeDescription(business: any) {
  const name = cleanName(String(business.name || "This business"));
  const category = String(business.category || "service");
  const location = String(business.estate || business.island || "the U.S. Virgin Islands");

  if (category === "restaurant") {
    return `${name} is a local dining spot serving visitors and residents near ${location}, with island flavor, convenient access, and a place in the VI Guide food directory.`;
  }

  if (category === "grocery") {
    return `${name} is a grocery and provisioning stop near ${location}, useful for visitors, villa guests, boaters, and residents stocking up across the Virgin Islands.`;
  }

  if (category === "retail") {
    return `${name} is a shopping destination near ${location}, helping visitors find local stores, gifts, essentials, and island retail options.`;
  }

  if (category === "hotel") {
    return `${name} is a lodging option near ${location}, offering visitors a convenient base for exploring the Virgin Islands.`;
  }

  if (category === "villa") {
    return `${name} connects visitors with villa-style stays and private island accommodations near ${location}.`;
  }

  if (category === "taxi") {
    return `${name} provides transportation access near ${location}, helping visitors move between beaches, hotels, ferry docks, airports, and island destinations.`;
  }

  if (category === "ferry") {
    return `${name} is a ferry access point near ${location}, helping travelers connect between islands and major waterfront destinations.`;
  }

  if (category === "airport") {
    return `${name} is an airport transportation hub serving visitors and residents traveling through the Virgin Islands.`;
  }

  if (category === "marina") {
    return `${name} is a marina and boating destination near ${location}, supporting charters, vessels, provisioning, and waterfront travel.`;
  }

  if (category === "cruise_port") {
    return `${name} is a cruise port destination near ${location}, serving cruise visitors, excursions, shopping, and island transportation.`;
  }

  if (category === "charter") {
    return `${name} offers charter and island adventure services near ${location}, supporting private trips, boating, sightseeing, and visitor experiences.`;
  }

  if (category === "dive_shop") {
    return `${name} supports diving, snorkeling, gear, and underwater experiences near ${location}.`;
  }

  if (category === "watersports") {
    return `${name} offers watersports and ocean activity services near ${location}.`;
  }

  if (category === "real_estate") {
    return `${name} supports real estate discovery, property services, and local market visibility near ${location}.`;
  }

  if (category === "contractor") {
    return `${name} provides contractor and property improvement services near ${location}.`;
  }

  return `${name} is a local business listing near ${location}, helping visitors and residents discover trusted Virgin Islands services.`;
}

function tagsFor(business: any) {
  const category = String(business.category || "");
  const island = String(business.island || "");
  const location = String(business.estate || "");

  const base = [
    category,
    label(category),
    island,
    location,
    "USVI",
    "Virgin Islands",
  ].filter(Boolean);

  if (category === "restaurant") {
    base.push("food", "dining", "local food", "visitor dining");
  }

  if (category === "grocery") {
    base.push("provisioning", "market", "food shopping", "villa supplies");
  }

  if (category === "retail") {
    base.push("shopping", "gifts", "stores", "local shops");
  }

  if (["ferry", "airport", "marina", "cruise_port", "taxi"].includes(category)) {
    base.push("transportation", "directions", "travel", "visitor access");
  }

  if (["hotel", "villa"].includes(category)) {
    base.push("lodging", "stay", "vacation", "visitor accommodation");
  }

  return Array.from(new Set(base.map((tag) => String(tag).trim()).filter(Boolean)));
}

async function run() {
  const snap = await db.collection("businesses").get();
  const now = Date.now();

  let updated = 0;

  console.log("Business records found:", snap.size);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    const oldName = String(data.name || docSnap.id);
    const name = cleanName(oldName);

    const currentDescription = String(data.description || "");
    const description = isGenericDescription(currentDescription, oldName)
      ? makeDescription({ ...data, name })
      : currentDescription;

    const tags = tagsFor({ ...data, name });

    await docSnap.ref.set(
      {
        name,
        description,
        tags,
        searchableText: [
          name,
          description,
          data.category,
          data.island,
          data.estate,
          data.address,
          ...tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        updatedAt: now,
      },
      { merge: true },
    );

    updated += 1;
    console.log(`Enriched: ${name}`);
  }

  console.log(`Business enrichment complete. Updated: ${updated}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});