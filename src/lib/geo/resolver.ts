import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { EstateRecord, ParcelRecord, GeoContext, MobilityIsland } from '../../types';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon, multiPolygon } from '@turf/helpers';

/**
 * Resolves the estate for a given point.
 */
export function resolveEstateForPoint(
  lat: number,
  lng: number,
  estates: EstateRecord[]
): EstateRecord | null {
  const pt = point([lng, lat]);

  const candidates = estates.filter((estate) => {
    const [minLng, minLat, maxLng, maxLat] = estate.bbox;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  });

  for (const estate of candidates) {
    try {
      if (booleanPointInPolygon(pt, estate.geometry)) {
        return estate;
      }
    } catch (e) {
      console.error(`Error checking point in estate ${estate.name}:`, e);
    }
  }

  return null;
}

/**
 * Resolves the parcel for a given point.
 */
export function resolveParcelForPoint(
  lat: number,
  lng: number,
  parcels: ParcelRecord[]
): ParcelRecord | null {
  const pt = point([lng, lat]);

  const candidates = parcels.filter((parcel) => {
    const [minLng, minLat, maxLng, maxLat] = parcel.bbox;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  });

  for (const parcel of candidates) {
    try {
      if (booleanPointInPolygon(pt, parcel.geometry)) {
        return parcel;
      }
    } catch (e) {
      console.error(`Error checking point in parcel ${parcel.parcelId}:`, e);
    }
  }

  return null;
}

/**
 * Unified geo resolver that maps a point to its island, estate, and parcel context.
 */
export async function resolveGeoContext(lat: number, lng: number): Promise<GeoContext> {
  // In a real production app, we would use a spatial index or a backend service.
  // For this implementation, we'll fetch relevant estates and parcels based on a rough bounding box.
  
  const estatesRef = collection(db, 'estates');
  const parcelsRef = collection(db, 'parcels');

  // Fetch all estates for now (they are relatively few)
  const estatesSnap = await getDocs(estatesRef);
  const estates = estatesSnap.docs.map(doc => {
    const data = doc.data() as EstateRecord;
    if (typeof data.geometry === 'string') {
      data.geometry = JSON.parse(data.geometry);
    }
    return data;
  });

  const estate = resolveEstateForPoint(lat, lng, estates);

  // If we found an estate, we can narrow down the parcel search
  let parcels: ParcelRecord[] = [];
  if (estate) {
    const q = query(parcelsRef, where('island', '==', estate.island), where('estateName', '==', estate.name));
    const parcelsSnap = await getDocs(q);
    parcels = parcelsSnap.docs.map(doc => {
      const data = doc.data() as ParcelRecord;
      if (typeof data.geometry === 'string') {
        data.geometry = JSON.parse(data.geometry);
      }
      return data;
    });
  } else {
    // Fallback: search all parcels (might be slow if there are many)
    const parcelsSnap = await getDocs(parcelsRef);
    parcels = parcelsSnap.docs.map(doc => {
      const data = doc.data() as ParcelRecord;
      if (typeof data.geometry === 'string') {
        data.geometry = JSON.parse(data.geometry);
      }
      return data;
    });
  }

  const parcel = resolveParcelForPoint(lat, lng, parcels);

  return {
    lat,
    lng,
    island: estate?.island ?? parcel?.island ?? 'unk',
    estate: estate ? {
      geoid: estate.geoid,
      name: estate.name,
      aliases: estate.aliases,
      quarter: estate.quarter
    } : undefined,
    parcel: parcel ? {
      parcelId: parcel.parcelId,
      sourceParcelId: parcel.sourceParcelId,
      sourceParcelNo: parcel.sourceParcelNo,
      address: parcel.address,
      estateName: parcel.estateName,
      ownerName: parcel.ownerName,
      centroid: parcel.centroid
    } : undefined
  };
}
