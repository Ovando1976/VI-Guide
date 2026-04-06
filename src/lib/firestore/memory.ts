import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy,
  limit,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { UserMemory } from '../../types';

const COLLECTION = 'user_memories';

export async function getUserMemories(userId: string): Promise<UserMemory[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('importance', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMemory));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
}

export async function saveMemory(userId: string, key: string, value: any, importance: number = 5): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('key', '==', key)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const memoryDoc = snapshot.docs[0];
      await updateDoc(doc(db, COLLECTION, memoryDoc.id), {
        value,
        importance,
        updatedAt: Date.now()
      });
    } else {
      await addDoc(collection(db, COLLECTION), {
        userId,
        key,
        value,
        importance,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION);
  }
}
