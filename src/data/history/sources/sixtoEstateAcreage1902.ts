export type SixtoEstateAcreage1902 = {
  name: string;
  aliases: string[];
  island: "st_thomas";
  acres: number | null;
  category:
    | "sugar-producing"
    | "indigo-coffee-divi-divi-annatto"
    | "health-resort"
    | "fruit-and-cotton"
    | "unknown";
  sourceTitle: string;
  sourcePage: number;
  note?: string;
};

export const sixtoEstateAcreage1902 = [] as SixtoEstateAcreage1902[];

function normalizeSixtoEstateKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^Estate\s+/i, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSixtoEstateAcreage1902(idOrName: unknown) {
  const key = normalizeSixtoEstateKey(idOrName);

  if (!key) return null;

  return (
    sixtoEstateAcreage1902.find((entry) =>
      [entry.name, ...entry.aliases].some(
        (candidate) => normalizeSixtoEstateKey(candidate) === key,
      ),
    ) ?? null
  );
}
