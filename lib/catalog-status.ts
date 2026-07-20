import type { DirectoryItem } from "@/types/directory";

export function isPermanentlyClosed(item: Pick<DirectoryItem, "operatingStatus">) {
  return item.operatingStatus === "permanently-closed";
}

export function isTemporarilyClosed(item: Pick<DirectoryItem, "operatingStatus">) {
  return item.operatingStatus === "temporarily-closed";
}

export function isDiscoverable(item: Pick<DirectoryItem, "operatingStatus">) {
  return !isPermanentlyClosed(item);
}

export function isActionable(item: Pick<DirectoryItem, "operatingStatus">) {
  return !isPermanentlyClosed(item) && !isTemporarilyClosed(item) && item.operatingStatus !== "seasonal";
}
