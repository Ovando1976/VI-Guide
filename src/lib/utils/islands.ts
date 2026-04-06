import { IslandCode } from "../../types";

const ISLAND_SET = new Set<IslandCode>([
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
]);

export function isIslandCode(value: string | undefined): value is IslandCode {
  return !!value && ISLAND_SET.has(value as IslandCode);
}
