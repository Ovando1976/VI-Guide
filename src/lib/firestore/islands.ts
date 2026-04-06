import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { IslandDoc } from '../../types';
import { handleFirestoreError, OperationType } from '../../firebase';

export async function getIslands(): Promise<IslandDoc[]> {
  try {
    const islandsRef = collection(db, 'islands');
    const q = query(islandsRef, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IslandDoc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'islands');
    return [];
  }
}
