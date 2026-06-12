import fs from "node:fs";

const file = "src/data/historic-sites.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));

const fixes = {
  "fort-frederik": "st_croix",
  "fort-christiansvaern": "st_croix",
  "christiansted-historic-district": "st_croix",
  "frederiksted-historic-district": "st_croix",
  "estate-whim-plantation": "st_croix",

  "annaberg-sugar-plantation": "st_john",
  "catherineberg-ruins": "st_john",
  "cinnamon-bay-archaeological-site": "st_john"
};

function islandFolder(islandCode) {
  return islandCode.replace("_", "-");
}

let updated = 0;

const cleaned = data.map((place) => {
  const correctIsland = fixes[place.slug];
  if (!correctIsland) return place;

  const folder = islandFolder(correctIsland);
  const imagePath = `/images/places/${folder}/${place.slug}-1.jpg`;

  updated++;

  return {
    ...place,
    islandCode: correctIsland,
    coverImage: imagePath,
    gallery: [imagePath],
    updatedAt: Date.now()
  };
});

fs.writeFileSync(file, JSON.stringify(cleaned, null, 2) + "\n");

console.log(`Fixed ${updated} historic-site island/image records.`);
