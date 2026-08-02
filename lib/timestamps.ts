type FirestoreTimestampLike = {
  seconds?: number;
  toDate?: () => Date;
};

export type TimestampInput = string | number | Date | FirestoreTimestampLike | null | undefined;

/** Normalize common JavaScript and Firestore timestamp shapes to an ISO string. */
export function normalizeTimestamp(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  let date: Date;
  if (value instanceof Date) date = value;
  else if (typeof value === "string" || typeof value === "number") date = new Date(value);
  else if (typeof value === "object") {
    const timestamp = value as FirestoreTimestampLike;
    if (typeof timestamp.toDate === "function") date = timestamp.toDate();
    else if (typeof timestamp.seconds === "number") date = new Date(timestamp.seconds * 1000);
    else return undefined;
  } else return undefined;

  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function normalizeTimestampOrEpoch(value: unknown) {
  return normalizeTimestamp(value) ?? new Date(0).toISOString();
}
