import { seedCanonicalData } from "./seed";

export async function seedMapData() {
  console.log("Starting VI Navigator seed...");
  await seedCanonicalData();
  console.log("VI Navigator seed complete.");
}