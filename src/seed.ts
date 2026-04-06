import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { IslandDoc, AreaDoc, BeachDoc, PlaceDoc, EventDoc, FeaturedSectionDoc } from './types';
import placesData from './data/places.json';
import eventsData from './data/events.json';

/**
 * Seed canonical data for VI Explorer Phase 1
 */
export async function seedCanonicalData() {
  console.log('Starting canonical data seeding...');

  // 1. Islands
  const islands: IslandDoc[] = [
    {
      code: 'st_thomas',
      name: 'Saint Thomas',
      shortName: 'St. Thomas',
      heroImage: 'https://picsum.photos/seed/stt_hero/1920/1080',
      description: 'The cosmopolitan heart of the U.S. Virgin Islands, known for its stunning beaches, luxury shopping, and vibrant nightlife.',
      featured: true,
      sortOrder: 1
    },
    {
      code: 'st_john',
      name: 'Saint John',
      shortName: 'St. John',
      heroImage: 'https://picsum.photos/seed/stj_hero/1920/1080',
      description: 'A nature lover\'s paradise, with over 60% of the island protected as a National Park.',
      featured: true,
      sortOrder: 2
    },
    {
      code: 'st_croix',
      name: 'Saint Croix',
      shortName: 'St. Croix',
      heroImage: 'https://picsum.photos/seed/stx_hero/1920/1080',
      description: 'The largest of the USVI, offering a rich cultural history, diverse landscapes, and a thriving culinary scene.',
      featured: true,
      sortOrder: 3
    }
  ];

  for (const island of islands) {
    await setDoc(doc(db, 'islands', island.code), island);
  }

  // 2. Areas (St. Thomas focus)
  const areas: AreaDoc[] = [
    {
      slug: 'charlotte-amalie',
      name: 'Charlotte Amalie',
      islandCode: 'st_thomas',
      kind: 'town',
      coordinates: { lat: 18.3419, lng: -64.9307 }
    },
    {
      slug: 'red-hook',
      name: 'Red Hook',
      islandCode: 'st_thomas',
      kind: 'town',
      coordinates: { lat: 18.3247, lng: -64.8504 }
    },
    {
      slug: 'magens-bay-area',
      name: 'Magens Bay Area',
      islandCode: 'st_thomas',
      kind: 'beach_area',
      coordinates: { lat: 18.3614, lng: -64.9256 }
    }
  ];

  for (const area of areas) {
    await setDoc(doc(db, 'areas', area.slug), area);
  }

  // 3. Beaches (St. Thomas focus)
  const beaches: BeachDoc[] = [
    {
      slug: 'magens-bay',
      title: 'Magens Bay',
      islandCode: 'st_thomas',
      areaSlug: 'magens-bay-area',
      description: 'Consistently rated as one of the world\'s most beautiful beaches, Magens Bay is a heart-shaped bay with calm, turquoise waters and a mile of white sand.',
      coordinates: { lat: 18.3614, lng: -64.9256 },
      coverImage: 'https://picsum.photos/seed/magens/1200/800',
      amenities: ['Parking', 'Restrooms', 'Showers', 'Lifeguards', 'Bar', 'Restaurant', 'Boutique'],
      tags: ['Calm Water', 'Family Friendly', 'Iconic'],
      familyFriendly: true,
      snorkeling: false,
      foodNearby: true,
      featured: true,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      slug: 'sapphire-beach',
      title: 'Sapphire Beach',
      islandCode: 'st_thomas',
      areaSlug: 'red-hook',
      description: 'Known for its brilliant blue water and excellent snorkeling right off the shore. Offers great views of St. John and the British Virgin Islands.',
      coordinates: { lat: 18.3347, lng: -64.8486 },
      coverImage: 'https://picsum.photos/seed/sapphire/1200/800',
      amenities: ['Parking', 'Restrooms', 'Bar', 'Snorkel Rental'],
      tags: ['Snorkeling', 'Views', 'Vibrant'],
      familyFriendly: true,
      snorkeling: true,
      foodNearby: true,
      featured: true,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  for (const beach of beaches) {
    await setDoc(doc(db, 'beaches', beach.slug), beach);
  }

  // 4. Places (St. Thomas focus - 2026 insights)
  const places: PlaceDoc[] = [
    {
      slug: 'island-executive-suv',
      title: 'Island Executive SUV Service',
      category: 'service',
      islandCode: 'st_thomas',
      areaSlug: 'charlotte-amalie',
      description: 'Premium private airport transfers and island tours in luxury SUVs. Featuring digital payments, cold water, and Bluetooth headset systems for clear tour narration.',
      shortDescription: 'Premium private SUV transfers & tours.',
      coordinates: { lat: 18.3419, lng: -64.9307 },
      coverImage: 'https://picsum.photos/seed/suv/1200/800',
      tags: ['Private', 'Luxury', 'Airport Transfer', '2026 Trend'],
      featured: true,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      slug: 'stt-provisioning',
      title: 'STT Provisioning & Villa Services',
      category: 'provisioning',
      islandCode: 'st_thomas',
      areaSlug: 'red-hook',
      description: 'Expert grocery delivery and villa setup for independent travelers. We handle the shopping so you can start your vacation the moment you arrive.',
      shortDescription: 'Grocery delivery & villa setup.',
      coordinates: { lat: 18.3247, lng: -64.8504 },
      coverImage: 'https://picsum.photos/seed/provisioning/1200/800',
      tags: ['Convenience', 'Villa Service', 'Airbnb Friendly'],
      featured: true,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    ...(placesData as any[])
  ];

  for (const place of places) {
    await setDoc(doc(db, 'places', place.slug), place, { merge: true });
  }

  // 5. Featured Sections
  const sections: FeaturedSectionDoc[] = [
    {
      key: 'home_hero',
      title: 'Explore the Virgin Islands',
      subtitle: 'Your 2026 guide to the best of St. Thomas and beyond.',
      enabled: true,
      itemRefs: [
        { collection: 'beaches', slug: 'magens-bay' },
        { collection: 'places', slug: 'island-executive-suv' }
      ],
      updatedAt: Date.now()
    },
    {
      key: 'featured_beaches',
      title: 'Top Beaches',
      subtitle: 'The must-visit shores of St. Thomas.',
      enabled: true,
      itemRefs: [
        { collection: 'beaches', slug: 'magens-bay' },
        { collection: 'beaches', slug: 'sapphire-beach' }
      ],
      updatedAt: Date.now()
    }
  ];

  for (const section of sections) {
    await setDoc(doc(db, 'featured_sections', section.key), section);
  }

  // 6. Events
  const events: EventDoc[] = [
    {
      slug: 'stt-carnival-2026',
      title: 'St. Thomas Carnival 2026',
      islandCode: 'st_thomas',
      areaSlug: 'charlotte-amalie',
      description: 'The biggest cultural celebration of the year! Parades, food, music, and more.',
      startAt: 1777507200000,
      coverImage: 'https://picsum.photos/seed/carnival/1200/800',
      coordinates: { lat: 18.3419, lng: -64.9307 },
      tags: ['Culture', 'Festival', 'Must See'],
      featured: true,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    ...(eventsData as any[])
  ];

  for (const event of events) {
    await setDoc(doc(db, 'events', event.slug), event, { merge: true });
  }

  // 7. Mobility Fare Rules
  const fareRules = [
    {
      id: 'stt-airport-redhook',
      island: 'stt',
      serviceType: 'standard',
      originZone: 'STT Airport',
      destinationZone: 'Red Hook Ferry',
      pricingMode: 'per_person',
      baseAmount: 15,
      perPassengerAmount: 12,
      luggageAmount: 2,
      active: true
    },
    {
      id: 'stt-airport-charlotte',
      island: 'stt',
      serviceType: 'standard',
      originZone: 'STT Airport',
      destinationZone: 'Charlotte Amalie',
      pricingMode: 'per_person',
      baseAmount: 10,
      perPassengerAmount: 8,
      luggageAmount: 2,
      active: true
    },
    {
      id: 'stj-cruzbay-coralbay',
      island: 'stj',
      serviceType: 'standard',
      originZone: 'Cruz Bay',
      destinationZone: 'Coral Bay',
      pricingMode: 'fixed',
      baseAmount: 25,
      active: true
    }
  ];

  for (const rule of fareRules) {
    await setDoc(doc(db, 'mobility_fare_rules', rule.id), rule);
  }

  // 8. Estates
  const estates = [
    {
      geoid: 'stt_lindbergh',
      island: 'stt',
      name: 'Estate Lindbergh Bay',
      aliases: ['Lindbergh', 'Airport Area'],
      quarter: 'Southside',
      centroid: { lat: 18.3373, lng: -64.9733 },
      bbox: [-64.98, 18.33, -64.96, 18.34],
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-64.98, 18.33],
          [-64.96, 18.33],
          [-64.96, 18.34],
          [-64.98, 18.34],
          [-64.98, 18.33]
        ]]
      }
    },
    {
      geoid: 'stt_redhook',
      island: 'stt',
      name: 'Estate Red Hook',
      aliases: ['Red Hook'],
      quarter: 'East End',
      centroid: { lat: 18.3325, lng: -64.8519 },
      bbox: [-64.86, 18.32, -64.84, 18.34],
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-64.86, 18.32],
          [-64.84, 18.32],
          [-64.84, 18.34],
          [-64.86, 18.34],
          [-64.86, 18.32]
        ]]
      }
    }
  ];

  for (const estate of estates) {
    await setDoc(doc(db, 'estates', estate.geoid), estate);
  }

  // 9. Parcels
  const parcels = [
    {
      parcelId: 'stt_airport_parcel',
      island: 'stt',
      estateName: 'Estate Lindbergh Bay',
      address: 'Cyril E. King Airport',
      ownerName: 'VI Port Authority',
      centroid: { lat: 18.3373, lng: -64.9733 },
      bbox: [-64.975, 18.335, -64.97, 18.34],
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-64.975, 18.335],
          [-64.97, 18.335],
          [-64.97, 18.34],
          [-64.975, 18.34],
          [-64.975, 18.335]
        ]]
      }
    }
  ];

  for (const parcel of parcels) {
    await setDoc(doc(db, 'parcels', parcel.parcelId), parcel);
  }

  console.log('Canonical data seeding complete.');
}
