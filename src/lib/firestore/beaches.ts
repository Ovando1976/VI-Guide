import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import type { BeachDoc, IslandCode } from "../../types";
import { USVI_BEACHES } from "../../data/usviBeaches";

const beachesRef = collection(db, "beaches");

function mapBeach(docSnap: any): BeachDoc {
  return { id: docSnap.id, ...docSnap.data() } as BeachDoc;
}

function sortBeaches(a: BeachDoc, b: BeachDoc) {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return a.title.localeCompare(b.title);
}

export async function getFeaturedBeaches(
  islandCode?: IslandCode,
  max = 8
): Promise<BeachDoc[]> {
  const fallback = USVI_BEACHES.filter(
    (beach) =>
      beach.status === "published" &&
      beach.featured === true &&
      (!islandCode || beach.islandCode === islandCode)
  )
    .sort(sortBeaches)
    .slice(0, max);

  try {
    const constraints: any[] = [
      where("status", "==", "published"),
      where("featured", "==", true),
    ];

    if (islandCode) {
      constraints.unshift(where("islandCode", "==", islandCode));
    }

    const snapshot = await getDocs(query(beachesRef, ...constraints));
    const data = snapshot.docs.map(mapBeach).sort(sortBeaches).slice(0, max);

    return data.length > 0 ? data : fallback;
  } catch (error) {
    console.error("getFeaturedBeaches failed:", error);
    return fallback;
  }
}

export async function getBeachBySlug(slug: string): Promise<BeachDoc | null> {
  try {
    const snapshot = await getDocs(
      query(
        beachesRef,
        where("slug", "==", slug),
        where("status", "==", "published")
      )
    );

    if (!snapshot.empty) return mapBeach(snapshot.docs[0]);
  } catch (error) {
    console.error("getBeachBySlug failed:", error);
  }

  return USVI_BEACHES.find((beach) => beach.slug === slug) ?? null;
}

export async function getBeachesByIsland(
  islandCode: IslandCode,
  max = 48
): Promise<BeachDoc[]> {
  const fallback = USVI_BEACHES.filter(
    (beach) => beach.islandCode === islandCode && beach.status === "published"
  )
    .sort(sortBeaches)
    .slice(0, max);

  try {
    const snapshot = await getDocs(
      query(
        beachesRef,
        where("islandCode", "==", islandCode),
        where("status", "==", "published")
      )
    );

    const data = snapshot.docs.map(mapBeach).sort(sortBeaches).slice(0, max);

    return data.length > 0 ? data : fallback;
  } catch (error) {
    console.error("getBeachesByIsland failed:", error);
    return fallback;
  }
}