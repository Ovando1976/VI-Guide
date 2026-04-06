import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { IslandCode } from '../../types';

export async function getTerritoryStats(islandCode: IslandCode) {
  try {
    const placesRef = collection(db, 'places');
    const eventsRef = collection(db, 'events');
    const transitRef = collection(db, 'transit_routes');

    const placesQuery = query(placesRef, where('islandCode', '==', islandCode), where('status', '==', 'published'));
    const eventsQuery = query(eventsRef, where('islandCode', '==', islandCode), where('status', '==', 'published'));
    const transitQuery = query(transitRef, where('islandCode', '==', islandCode));

    const [placesSnap, eventsSnap, transitSnap] = await Promise.all([
      getCountFromServer(placesQuery),
      getCountFromServer(eventsQuery),
      getCountFromServer(transitQuery)
    ]);

    return {
      activeListings: placesSnap.data().count,
      upcomingEvents: eventsSnap.data().count,
      transitHubs: transitSnap.data().count
    };
  } catch (error) {
    console.error('Error fetching territory stats:', error);
    return {
      activeListings: 0,
      upcomingEvents: 0,
      transitHubs: 0
    };
  }
}
