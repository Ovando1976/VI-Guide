export type { AccommodationRecord } from "@/types/accommodation";

import type { AccommodationRecord } from "@/types/accommodation";

export type CatalogSeed = Omit<
  AccommodationRecord,
  "id" | "slug" | "description" | "heroImage" | "tags"
> & {
  description?: string;
  heroImage?: string;
  tags?: string[];
};

export type AccommodationImageSource = {
  localPath?: string;
};