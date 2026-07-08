import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase";
import type {
  MerchantLeadDoc,
  MerchantLeadInput,
} from "../../types/businessDemo";

const COLLECTION = "merchantLeads";

function now() {
  return Date.now();
}

export async function createMerchantLead(
  input: MerchantLeadInput
): Promise<MerchantLeadDoc> {
  const timestamp = now();

  const payload = {
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);

  return {
    id: ref.id,
    ...payload,
  };
}

export function subscribeToMerchantLeads(
  callback: (leads: MerchantLeadDoc[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((lead) => ({
          id: lead.id,
          ...(lead.data() as Omit<MerchantLeadDoc, "id">),
        }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
