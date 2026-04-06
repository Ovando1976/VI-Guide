import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { EventDoc, IslandCode } from "../../types";

const eventsRef = collection(db, "events");

export async function getUpcomingEvents(
  islandCode?: IslandCode,
  now = Date.now(),
  max = 12
): Promise<EventDoc[]> {
  const constraints: any[] = [
    where("status", "==", "published"),
    where("startAt", ">=", now),
    orderBy("startAt", "asc"),
    limit(max),
  ];

  if (islandCode) {
    constraints.unshift(where("islandCode", "==", islandCode));
  }

  const snapshot = await getDocs(query(eventsRef, ...constraints));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventDoc));
}
