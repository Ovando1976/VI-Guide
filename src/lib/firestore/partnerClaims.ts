import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../../firebase";
import type {
  PartnerClaimDoc,
  PartnerClaimInput,
  PartnerClaimStatus,
} from "../../types/businessDemo";

const COLLECTION = "partnerClaims";

function now() {
  return Date.now();
}

export async function createPartnerClaim(
  input: PartnerClaimInput
): Promise<PartnerClaimDoc> {
  const timestamp = now();

  const payload = {
    ...input,
    status: "new" as PartnerClaimStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);

  return {
    id: ref.id,
    ...payload,
  };
}

export async function updatePartnerClaimStatus(
  claimId: string,
  status: PartnerClaimStatus
) {
  await updateDoc(doc(db, COLLECTION, claimId), {
    status,
    updatedAt: now(),
  });
}

export function subscribeToPartnerClaims(
  callback: (claims: PartnerClaimDoc[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((claim) => ({
          id: claim.id,
          ...(claim.data() as Omit<PartnerClaimDoc, "id">),
        }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
