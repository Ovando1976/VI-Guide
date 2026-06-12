import fs from "node:fs";

const OUT = "src/data/beaches.json";
const NOW = Date.now();

const beaches = [
  ["magens-bay-beach", "Magens Bay Beach", "st_thomas", 18.3626, -64.9232, true],
  ["coki-point-beach", "Coki Point Beach", "st_thomas", 18.3502, -64.865, true],
  ["sapphire-beach", "Sapphire Beach", "st_thomas", 18.3349, -64.8496, true],
  ["lindquist-beach", "Lindquist Beach", "st_thomas", 18.3388, -64.8556, true],
  ["secret-harbour-beach", "Secret Harbour Beach", "st_thomas", 18.3187, -64.8523, true],
  ["brewers-bay-beach", "Brewers Bay Beach", "st_thomas", 18.3446, -64.9775, true],
  ["hull-bay-beach", "Hull Bay Beach", "st_thomas", 18.3717, -64.9517, false],
  ["morningstar-beach", "Morningstar Beach", "st_thomas", 18.3262, -64.9185, false],
  ["bolongo-bay-beach", "Bolongo Bay Beach", "st_thomas", 18.3138, -64.8967, false],
  ["limetree-beach", "Limetree Beach", "st_thomas", 18.3182, -64.9105, false],
  ["cowpet-bay-beach", "Cowpet Bay Beach", "st_thomas", 18.3186, -64.8468, false],
  ["vessup-bay-beach", "Vessup Bay Beach", "st_thomas", 18.3242, -64.8522, false],
  ["dorothea-beach", "Dorothea Beach", "st_thomas", 18.3698, -64.9463, false],
  ["neltjeberg-bay-beach", "Neltjeberg Bay Beach", "st_thomas", 18.3735, -64.9422, false],
  ["santa-maria-bay-beach", "Santa Maria Bay Beach", "st_thomas", 18.3734, -64.9745, false],
  ["mermaids-chair", "Mermaid's Chair", "st_thomas", 18.3196, -65.0347, false],

  ["honeymoon-beach-water-island", "Honeymoon Beach Water Island", "water_island", 18.3169, -64.9563, true],
  ["limestone-bay-beach", "Limestone Bay Beach", "water_island", 18.3139, -64.9638, false],

  ["trunk-bay-beach", "Trunk Bay Beach", "st_john", 18.3527, -64.7685, true],
  ["cinnamon-bay-beach", "Cinnamon Bay Beach", "st_john", 18.3564, -64.7588, true],
  ["maho-bay-beach", "Maho Bay Beach", "st_john", 18.357, -64.7452, true],
  ["hawksnest-beach", "Hawksnest Beach", "st_john", 18.3507, -64.7799, true],
  ["francis-bay-beach", "Francis Bay Beach", "st_john", 18.3638, -64.7443, false],
  ["salt-pond-bay-beach", "Salt Pond Bay Beach", "st_john", 18.3102, -64.7056, false],
  ["honeymoon-beach-st-john", "Honeymoon Beach St. John", "st_john", 18.3419, -64.7868, true],
  ["jumbie-bay-beach", "Jumbie Bay Beach", "st_john", 18.3509, -64.7727, false],
  ["gibney-beach", "Gibney Beach", "st_john", 18.3515, -64.7825, false],
  ["denis-bay-beach", "Denis Bay Beach", "st_john", 18.3538, -64.7851, false],
  ["waterlemon-cay-beach", "Waterlemon Cay Beach", "st_john", 18.3657, -64.7223, false],
  ["hansen-bay-beach", "Hansen Bay Beach", "st_john", 18.3462, -64.6825, false],
  ["haulover-bay-beach", "Haulover Bay Beach", "st_john", 18.3522, -64.7034, false],
  ["great-cruz-bay-beach", "Great Cruz Bay Beach", "st_john", 18.3262, -64.7908, false],

  ["rainbow-beach", "Rainbow Beach", "st_croix", 17.7126, -64.8945, true],
  ["cane-bay-beach", "Cane Bay Beach", "st_croix", 17.7716, -64.8101, true],
  ["sandy-point-beach", "Sandy Point Beach", "st_croix", 17.6856, -64.8915, true],
  ["dorsch-beach", "Dorsch Beach", "st_croix", 17.7026, -64.8851, false],
  ["shoys-beach", "Shoys Beach", "st_croix", 17.7548, -64.6822, false],
  ["buccaneer-beach", "Buccaneer Beach", "st_croix", 17.7544, -64.6829, false],
  ["pelican-cove-beach", "Pelican Cove Beach", "st_croix", 17.7616, -64.7365, false],
  ["protestant-cay-beach", "Protestant Cay Beach", "st_croix", 17.7497, -64.7027, false],
  ["grapetree-bay-beach", "Grapetree Bay Beach", "st_croix", 17.7462, -64.5853, false],
  ["jack-and-isaac-bay-beach", "Jack and Isaac Bay Beach", "st_croix", 17.7552, -64.5696, false],
  ["sprat-hall-beach", "Sprat Hall Beach", "st_croix", 17.7082, -64.9017, false],
  ["frederiksted-beach", "Frederiksted Beach", "st_croix", 17.714, -64.8843, false],
  ["annaly-bay-beach", "Annaly Bay Beach", "st_croix", 17.766, -64.8564, false],
  ["tamarind-reef-beach", "Tamarind Reef Beach", "st_croix", 17.7569, -64.6805, false]
];

function islandFolder(code) {
  return code.replaceAll("_", "-");
}

const data = beaches.map(([slug, title, islandCode, lat, lng, featured]) => {
  const folder = islandFolder(islandCode);
  return {
    slug,
    title,
    category: "beach",
    islandCode,
    areaSlug: "beaches",
    description: `${title} is a beach destination in the U.S. Virgin Islands.`,
    shortDescription: `Beach on ${islandCode.replace("st_", "St. ").replace("_", " ")}.`,
    coverImage: `/images/places/${folder}/${slug}-1.jpg`,
    gallery: [`/images/places/${folder}/${slug}-1.jpg`],
    tags: ["beach", "swimming", "usvi"],
    coordinates: { lat, lng },
    address: "",
    phone: "",
    website: "",
    priceTier: "$",
    featured,
    status: "published",
    createdAt: 1710000000000,
    updatedAt: NOW,
    coordinateSource: "curated",
    coordinateConfidence: "APPROXIMATE",
    geocodedAddress: `${title}, USVI`,
    googlePlaceId: ""
  };
});

fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${data.length} beaches to ${OUT}`);
