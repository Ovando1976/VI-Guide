import type { IslandCode } from "../../types";

export function isRideRequest(message: string) {
  return /\b(taxi|ride|cab|pickup|pick up|take me|drive me|transport|drop.?off|airport|ferry)\b/i.test(
    message,
  );
}

export function buildConciergeRidePath(input: {
  message: string;
  island: IslandCode;
}) {
  const params = new URLSearchParams();

  params.set("island", input.island);
  params.set("intent", "concierge-ride");
  params.set("q", input.message.trim());

  return `/mobility?${params.toString()}`;
}