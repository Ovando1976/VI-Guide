import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { PlaceCategory, PlaceDoc, IslandCode } from "../../types";

const placesRef = collection(db, "places");

export async function getPlacesByCategory(
  category: PlaceCategory,
  islandCode?: IslandCode,
  max = 24
): Promise<PlaceDoc[]> {
  const constraints: any[] = [
    where("category", "==", category),
    where("status", "==", "published"),
    orderBy("featured", "desc"),
    orderBy("title", "asc"),
    limit(max),
  ];

  if (islandCode) {
    constraints.unshift(where("islandCode", "==", islandCode));
  }

  const snapshot = await getDocs(query(placesRef, ...constraints));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PlaceDoc));
}

export async function getPlaceBySlug(slug: string): Promise<PlaceDoc | null> {
  const snapshot = await getDocs(
    query(
      placesRef,
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1)
    )
  );

  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PlaceDoc;
}
