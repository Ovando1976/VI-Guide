import type { DemoPartnerAction } from "../data/demoPartners";

export type DemoPartnerEvent = {
  id: string;
  partnerId: string;
  partnerName: string;
  action: DemoPartnerAction;
  message: string;
  createdAt: string;
};

const STORAGE_KEY = "vi-guide-demo-partner-events";

const actionLabels: Record<DemoPartnerAction, string> = {
  profile_view: "viewed the partner profile",
  call: "tapped the call button",
  directions: "requested directions",
  save: "saved this place",
  request_info: "requested more information",
  concierge: "asked the AI concierge about this partner",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readDemoPartnerEvents(): DemoPartnerEvent[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearDemoPartnerEvents() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function logDemoPartnerEvent(input: {
  partnerId: string;
  partnerName: string;
  action: DemoPartnerAction;
  message?: string;
}) {
  const event: DemoPartnerEvent = {
    id: `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    action: input.action,
    message:
      input.message ??
      `Visitor ${actionLabels[input.action]} for ${input.partnerName}.`,
    createdAt: new Date().toISOString(),
  };

  if (!canUseStorage()) return event;

  const existing = readDemoPartnerEvents();
  const next = [event, ...existing].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  window.dispatchEvent(
    new CustomEvent("vi-guide-demo-partner-event", { detail: event })
  );

  return event;
}

export function seedDemoPartnerEvents() {
  const samples: Omit<DemoPartnerEvent, "id" | "createdAt">[] = [
    {
      partnerId: "sapphire-beach-bar",
      partnerName: "Sapphire Beach Bar",
      action: "request_info",
      message: "Visitor asked: “Do you have live music tonight?”",
    },
    {
      partnerId: "vi-taxi",
      partnerName: "VI Taxi Association",
      action: "concierge",
      message: "Visitor asked the concierge for airport-to-Red-Hook transportation.",
    },
    {
      partnerId: "three-palms",
      partnerName: "3 Palms",
      action: "directions",
      message: "Visitor requested directions from the Red Hook ferry area.",
    },
    {
      partnerId: "coral-world",
      partnerName: "Coral World Ocean Park",
      action: "save",
      message: "Family visitor saved this attraction to a cruise-day plan.",
    },
  ];

  const events = samples.map((sample, index) => ({
    ...sample,
    id: `seed-${Date.now()}-${index}`,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 17).toISOString(),
  }));

  if (!canUseStorage()) return events;

  const existing = readDemoPartnerEvents();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...events, ...existing].slice(0, 50))
  );

  window.dispatchEvent(new CustomEvent("vi-guide-demo-partner-event"));

  return events;
}
