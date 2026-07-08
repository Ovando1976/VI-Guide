import type { VIConnectDateIdea, VIConnectProfile } from "../../types/viConnect";

export type VIConnectDatePlanStatus = "draft" | "saved" | "cancelled";

export type VIConnectDatePlan = {
  id: string;
  profileId: string;
  profileName: string;
  island: VIConnectProfile["island"];
  title: string;
  description: string;
  vibe: string;
  estimatedCost: string;
  timeWindow: string;
  placeType: string;
  note: string;
  inviteText: string;
  status: VIConnectDatePlanStatus;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "vi-connect-date-plans-v1";

function createDatePlanId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `vi-date-plan-${crypto.randomUUID()}`;
  }

  return `vi-date-plan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function buildVIConnectInviteText({
  profile,
  dateIdea,
  timeWindow,
  placeType,
  note,
}: {
  profile: VIConnectProfile;
  dateIdea?: VIConnectDateIdea;
  timeWindow: string;
  placeType: string;
  note: string;
}) {
  const title = dateIdea?.title || "a public first meetup";
  const vibe = dateIdea?.vibe || "relaxed and public";

  return [
    `Hey ${profile.displayName}, I liked your profile.`,
    `Would you be open to ${title}?`,
    `I was thinking ${timeWindow.toLowerCase()} somewhere ${placeType.toLowerCase()}.`,
    `The vibe would be ${vibe.toLowerCase()}.`,
    note.trim() ? `Also: ${note.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getVIConnectDatePlans(): VIConnectDatePlan[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VIConnectDatePlan[];
  } catch {
    return [];
  }
}

export function saveVIConnectDatePlan(plan: Omit<VIConnectDatePlan, "id" | "createdAt" | "updatedAt" | "status">) {
  const now = new Date().toISOString();

  const next: VIConnectDatePlan = {
    ...plan,
    id: createDatePlanId(),
    status: "saved",
    createdAt: now,
    updatedAt: now,
  };

  if (typeof window !== "undefined") {
    const plans = getVIConnectDatePlans();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...plans]));
    window.dispatchEvent(new CustomEvent("vi-connect-date-plans-changed"));
  }

  return next;
}

export function clearVIConnectDatePlans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("vi-connect-date-plans-changed"));
}
