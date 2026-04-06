import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  Driver, 
  Vehicle, 
  Trip, 
  FareRule, 
  Partner, 
  TripStatus,
  MobilityIsland,
  TripLocation
} from '../../types';
import { resolveGeoContext } from '../geo/resolver';

const DRIVERS_COL = 'mobility_drivers';
const VEHICLES_COL = 'mobility_vehicles';
const TRIPS_COL = 'mobility_trips';
const FARE_RULES_COL = 'mobility_fare_rules';
const PARTNERS_COL = 'mobility_partners';

// --- Geo Enrichment ---

export async function enrichLocation(location: TripLocation): Promise<TripLocation> {
  try {
    const context = await resolveGeoContext(location.lat, location.lng);
    return {
      ...location,
      estateGeoid: context.estate?.geoid,
      estateName: context.estate?.name,
      parcelId: context.parcel?.parcelId,
      island: context.island
    };
  } catch (error) {
    console.error('Failed to enrich location:', error);
    return location;
  }
}

// --- Trips ---

export async function createTripRequest(tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(db, TRIPS_COL), {
      ...tripData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TRIPS_COL);
    throw error;
  }
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  try {
    const docSnap = await getDoc(doc(db, TRIPS_COL, tripId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Trip;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, TRIPS_COL);
    return null;
  }
}

export function subscribeToTrip(tripId: string, callback: (trip: Trip) => void) {
  return onSnapshot(doc(db, TRIPS_COL, tripId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Trip);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, TRIPS_COL);
  });
}

export async function updateTripStatus(tripId: string, status: TripStatus, extraData: Partial<Trip> = {}) {
  try {
    await updateDoc(doc(db, TRIPS_COL, tripId), {
      status,
      ...extraData,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TRIPS_COL);
  }
}

// --- Drivers ---

export async function getActiveDrivers(island: MobilityIsland): Promise<Driver[]> {
  try {
    const q = query(
      collection(db, DRIVERS_COL),
      where('island', '==', island),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DRIVERS_COL);
    return [];
  }
}

export async function getDriverProfile(driverId: string): Promise<Driver | null> {
  try {
    const docSnap = await getDoc(doc(db, DRIVERS_COL, driverId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Driver;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DRIVERS_COL);
    return null;
  }
}

// --- Fare Rules ---

export async function getFareRules(island: MobilityIsland | 'multi'): Promise<FareRule[]> {
  try {
    const q = query(
      collection(db, FARE_RULES_COL),
      where('island', '==', island),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FareRule));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, FARE_RULES_COL);
    return [];
  }
}

// --- Pricing Logic ---

export async function calculateQuote(params: {
  island: MobilityIsland;
  tripType: string;
  passengers: number;
  luggage: number;
  serviceClass: 'private' | 'shared';
  originZone: string;
  destinationZone: string;
}): Promise<Trip['quote']> {
  // Fetch relevant fare rules
  const rules = await getFareRules(params.island);
  
  // Find matching rule
  const rule = rules.find(r => 
    r.serviceType === params.tripType && 
    r.originZone === params.originZone && 
    r.destinationZone === params.destinationZone
  );

  if (!rule) {
    // Fallback or default pricing if no specific rule exists
    // In a real app, this would be more complex
    const base = 20;
    const perPerson = 5;
    const luggageFee = params.luggage * 2;
    const total = base + (params.passengers > 1 ? (params.passengers - 1) * perPerson : 0) + luggageFee;
    
    return {
      baseFare: base,
      luggageFee,
      waitingFee: 0,
      premiumFee: params.serviceClass === 'private' ? 15 : 0,
      total: total + (params.serviceClass === 'private' ? 15 : 0),
      currency: 'USD'
    };
  }

  let total = rule.baseAmount;
  let luggageFee = (rule.luggageAmount || 0) * params.luggage;
  let premiumFee = 0;

  if (rule.pricingMode === 'per_person') {
    total = rule.baseAmount + (params.passengers > 1 ? (params.passengers - 1) * (rule.perPassengerAmount || 0) : 0);
  }

  if (params.serviceClass === 'private') {
    premiumFee = 20; // Default private premium if not in rule
  }

  return {
    baseFare: rule.baseAmount,
    luggageFee,
    waitingFee: 0,
    premiumFee,
    total: total + luggageFee + premiumFee,
    currency: 'USD'
  };
}
