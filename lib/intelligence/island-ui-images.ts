import type { IntelligenceIsland } from "@/types/intelligence";
import type { IslandTrustedImage } from "@/types/island-workspace";

const CONTEXT_IMAGES: Readonly<Record<IntelligenceIsland, IslandTrustedImage>> =
  Object.freeze({
    stt: Object.freeze({
      src: "/images/usvi-harbor-hero.jpg",
      alt: "St. Thomas island context image used when a place-specific image is not verified",
      status: "context" as const,
    }),
    stj: Object.freeze({
      src: "/images/places/st-john/trunk-bay-overlook-1.jpg",
      alt: "St. John island context image used when a place-specific image is not verified",
      status: "context" as const,
    }),
    stx: Object.freeze({
      src: "/images/places/st-croix/cane-bay-beach-1.jpg",
      alt: "St. Croix island context image used when a place-specific image is not verified",
      status: "context" as const,
    }),
  });

export const GENERIC_DIRECTORY_IMAGES = new Set([
  "/images/magens-bay.jpg",
  "/images/usvi-harbor-hero.jpg",
]);

export function getIslandContextImage(
  island: IntelligenceIsland,
): IslandTrustedImage {
  return CONTEXT_IMAGES[island];
}

export function isLocalIslandImage(value: string | undefined) {
  return Boolean(value && value.startsWith("/images/"));
}
