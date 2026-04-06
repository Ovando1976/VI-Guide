import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { BeachDoc, PlaceDoc, IslandCode } from '../../types';
import { handleFirestoreError, OperationType } from '../../firebase';

export async function getFeaturedListings(island?: IslandCode): Promise<(BeachDoc | PlaceDoc)[]> {
  const featured: (BeachDoc | PlaceDoc)[] = [];
  
  try {
    // Fetch featured beaches
    const beachesRef = collection(db, 'beaches');
    const beachQuery = island 
      ? query(beachesRef, where('featured', '==', true), where('islandCode', '==', island), where('status', '==', 'published'), limit(5))
      : query(beachesRef, where('featured', '==', true), where('status', '==', 'published'), limit(5));
    
    const beachSnap = await getDocs(beachQuery);
    beachSnap.forEach(doc => {
      featured.push({ id: doc.id, ...doc.data() } as BeachDoc);
    });

    // Fetch featured places
    const placesRef = collection(db, 'places');
    const placeQuery = island
      ? query(placesRef, where('featured', '==', true), where('islandCode', '==', island), where('status', '==', 'published'), limit(5))
      : query(placesRef, where('featured', '==', true), where('status', '==', 'published'), limit(5));
    
    const placeSnap = await getDocs(placeQuery);
    placeSnap.forEach(doc => {
      featured.push({ id: doc.id, ...doc.data() } as PlaceDoc);
    });

    // Sort by some criteria if needed, or just return
    return featured.sort(() => Math.random() - 0.5); // Randomize for now
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'beaches/places');
    return [];
  }
}
