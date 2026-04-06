import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { BeachDoc, IslandCode } from "../../types";

const beachesRef = collection(db, "beaches");

export async function getFeaturedBeaches(
  islandCode?: IslandCode,
  max = 8
): Promise<BeachDoc[]> {
  const constraints: any[] = [
    where("status", "==", "published"),
    where("featured", "==", true),
    orderBy("updatedAt", "desc"),
    limit(max),
  ];

  if (islandCode) {
    constraints.unshift(where("islandCode", "==", islandCode));
  }

  const snapshot = await getDocs(query(beachesRef, ...constraints));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BeachDoc));
}

export async function getBeachBySlug(slug: string): Promise<BeachDoc | null> {
  const snapshot = await getDocs(
    query(
      beachesRef,
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1)
    )
  );

  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BeachDoc;
}

export async function getBeachesByIsland(
  islandCode: IslandCode,
  max = 24
): Promise<BeachDoc[]> {
  const snapshot = await getDocs(
    query(
      beachesRef,
      where("islandCode", "==", islandCode),
      where("status", "==", "published"),
      orderBy("featured", "desc"),
      orderBy("title", "asc"),
      limit(max)
    )
  );

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BeachDoc));
}
