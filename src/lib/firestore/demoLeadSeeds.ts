import { addDoc, collection } from "firebase/firestore";

import { db } from "../../firebase";

const PARTNER_CLAIMS = "partnerClaims";
const MERCHANT_LEADS = "merchantLeads";
const MOBILITY_REQUESTS = "mobilityRequests";

export async function createSampleAdminLeads() {
  const now = Date.now();

  const partnerClaims = [
    {
      partnerId: "sapphire-beach-bar",
      partnerName: "Sapphire Beach Bar",
      businessName: "Sapphire Beach Bar",
      ownerName: "Maria Thomas",
      email: "maria@sapphirebeach.example",
      phone: "(340) 555-0141",
      area: "East End",
      partnerTier: "Concierge Partner",
      status: "new",
      source: "admin-demo",
      message:
        "Interested in being recommended for beach days, dinner plans, and cruise visitor itineraries.",
      createdAt: now - 1000 * 60 * 15,
      updatedAt: now - 1000 * 60 * 15,
    },
    {
      partnerId: "vi-taxi-association",
      partnerName: "VI Taxi Association",
      businessName: "VI Taxi Association",
      ownerName: "David Francis",
      email: "dispatch@vitaxi.example",
      phone: "(340) 555-0188",
      area: "Islandwide",
      partnerTier: "Mobility Partner",
      status: "reviewing",
      source: "admin-demo",
      message:
        "Wants to review how visitor transportation requests can flow into a dispatcher board.",
      createdAt: now - 1000 * 60 * 45,
      updatedAt: now - 1000 * 60 * 20,
    },
  ];

  const merchantLeads = [
    {
      partnerId: "coral-world-ocean-park",
      partnerName: "Coral World Ocean Park",
      action: "directions",
      source: "partner-card",
      visitorName: "Cruise Family",
      visitorPhone: "(340) 555-2020",
      visitorEmail: "cruise.family@example.com",
      message:
        "Visitor tapped directions after viewing Coral World as a recommended family attraction.",
      createdAt: now - 1000 * 60 * 8,
      updatedAt: now - 1000 * 60 * 8,
    },
    {
      partnerId: "mountain-top",
      partnerName: "Mountain Top",
      action: "ai_mention",
      source: "concierge",
      visitorName: "Island Explorer",
      visitorPhone: "(340) 555-3030",
      visitorEmail: "explorer@example.com",
      message:
        "AI concierge recommended Mountain Top for scenic views, shopping, and a short tour stop.",
      createdAt: now - 1000 * 60 * 25,
      updatedAt: now - 1000 * 60 * 25,
    },
    {
      partnerId: "three-palms",
      partnerName: "3 Palms",
      action: "call",
      source: "partner-card",
      visitorName: "Dinner Guest",
      visitorPhone: "(340) 555-9090",
      visitorEmail: "dinner.guest@example.com",
      message:
        "Visitor tapped call while planning dinner near Red Hook after ferry travel.",
      createdAt: now - 1000 * 60 * 35,
      updatedAt: now - 1000 * 60 * 35,
    },
  ];

  const mobilityRequests = [
    {
      serviceType: "airport_transfer",
      island: "st_thomas",
      pickup: "Cyril E. King Airport",
      dropoff: "Red Hook Ferry Terminal",
      pickupTime: "Today · 4:30 PM",
      passengers: 2,
      luggage: 2,
      visitorName: "Demo Visitor",
      visitorPhone: "(340) 555-1010",
      notes: "Needs ferry-aware transfer timing.",
      estimatedFare: 40,
      status: "new",
      source: "admin-demo",
      createdAt: now - 1000 * 60 * 12,
      updatedAt: now - 1000 * 60 * 12,
    },
    {
      serviceType: "cruise_pickup",
      island: "st_thomas",
      pickup: "Havensight Cruise Port",
      dropoff: "Magens Bay",
      pickupTime: "Today · 10:15 AM",
      passengers: 4,
      luggage: 0,
      visitorName: "Cruise Family",
      visitorPhone: "(340) 555-2020",
      notes: "Round trip beach day request.",
      estimatedFare: 48,
      status: "accepted",
      source: "admin-demo",
      createdAt: now - 1000 * 60 * 75,
      updatedAt: now - 1000 * 60 * 30,
    },
    {
      serviceType: "dinner_nightlife",
      island: "st_thomas",
      pickup: "Sapphire Beach",
      dropoff: "Red Hook Restaurants",
      pickupTime: "Tonight · 7:00 PM",
      passengers: 3,
      luggage: 0,
      visitorName: "Dinner Guest",
      visitorPhone: "(340) 555-3030",
      notes: "Wants pickup after dinner too.",
      estimatedFare: 46,
      status: "driver_en_route",
      source: "admin-demo",
      createdAt: now - 1000 * 60 * 95,
      updatedAt: now - 1000 * 60 * 15,
    },
  ];

  const writes = [
    ...partnerClaims.map((claim) => addDoc(collection(db, PARTNER_CLAIMS), claim)),
    ...merchantLeads.map((lead) => addDoc(collection(db, MERCHANT_LEADS), lead)),
    ...mobilityRequests.map((request) =>
      addDoc(collection(db, MOBILITY_REQUESTS), request)
    ),
  ];

  await Promise.all(writes);

  return {
    partnerClaims: partnerClaims.length,
    merchantLeads: merchantLeads.length,
    mobilityRequests: mobilityRequests.length,
    total: partnerClaims.length + merchantLeads.length + mobilityRequests.length,
  };
}
