import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase";

export function useCollectionCount(collectionName: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const snap = await getCountFromServer(collection(db, collectionName));
        if (!cancelled) setCount(snap.data().count);
      } catch (error) {
        console.warn(`Could not count ${collectionName}`, error);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [collectionName]);

  return count;
}
