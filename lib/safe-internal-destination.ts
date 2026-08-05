export function safeInternalDestination(
  value: string | null,
  origin: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const base = new URL(origin);
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return "/";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}
