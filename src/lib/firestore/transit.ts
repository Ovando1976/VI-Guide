import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { TransitRoute, IslandCode } from '../../types';

const COLLECTION = 'transit_routes';

export async function getTransitRoutes(island: IslandCode): Promise<TransitRoute[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('islandCode', '==', island),
      orderBy('lastUpdated', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransitRoute));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
}

export function subscribeToTransitRoutes(island: IslandCode, callback: (routes: TransitRoute[]) => void) {
  const q = query(
    collection(db, COLLECTION),
    where('islandCode', '==', island),
    orderBy('lastUpdated', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransitRoute));
    callback(routes);
  }, (error) => handleFirestoreError(error, OperationType.LIST, COLLECTION));
}

export async function createTransitRoute(routeData: Omit<TransitRoute, 'id' | 'lastUpdated'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...routeData,
      lastUpdated: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    throw error;
  }
}

export async function deleteTransitRoute(routeId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, COLLECTION, routeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${routeId}`);
  }
}
