export function safeInternalDestinationOrNull(
  value: string | null,
  origin: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;

  try {
    const base = new URL(origin);
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

export function safeInternalDestination(
  value: string | null,
  origin: string,
) {
  return safeInternalDestinationOrNull(value, origin) ?? "/";
}
