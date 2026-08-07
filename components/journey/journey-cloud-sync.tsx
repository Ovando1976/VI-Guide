"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

import { useAuth } from "@/components/auth-provider";
import { mergeJourneyCloudState } from "@/lib/journey-cloud-state";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  normalizeJourneyPlan,
  readJourneyPlans,
  writeJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  normalizeJourneyTombstones,
  readJourneyTombstones,
  writeJourneyTombstones,
  type JourneyTombstone,
} from "@/lib/journey-sync-state";
import {
  normalizeTravelerTripSelection,
  readSelectedTravelerTripSelection,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
  writeSelectedTravelerTripPlanId,
  type TravelerTripSelection,
} from "@/lib/traveler-trip-selection";

type SyncState = "local" | "syncing" | "synced" | "error";
type JourneyApiPayload = {
  plans?: unknown;
  tombstones?: unknown;
  activePlanId?: unknown;
  activePlanUpdatedAt?: unknown;
  error?: string;
};

type ParsedJourneyApiPayload = {
  plans: JourneyPlan[];
  tombstones: JourneyTombstone[];
  selection: TravelerTripSelection;
};

export function JourneyCloudSync() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [state, setState] = useState<SyncState>("local");
  const [message, setMessage] = useState("Saved on this device");
  const applyingRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("local");
      setMessage("Sign in to sync this trip across devices");
      return;
    }

    const authenticatedUser = user;
    let cancelled = false;

    async function hydrate() {
      setState("syncing");
      setMessage("Syncing trips across devices…");
      try {
        const token = await authenticatedUser.getIdToken();
        const response = await fetch("/api/journeys", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as JourneyApiPayload | null;
        if (!response.ok) throw new Error(payload?.error || "Journey sync failed.");

        const remote = parsePayload(payload);
        const merged = mergeJourneyCloudState({
          localPlans: readJourneyPlans(),
          remotePlans: remote.plans,
          localTombstones: readJourneyTombstones(),
          remoteTombstones: remote.tombstones,
          localSelection: readSelectedTravelerTripSelection(),
          remoteSelection: remote.selection,
        });
        applyState(merged, applyingRemote);

        const canonical = await push(
          authenticatedUser,
          merged.plans,
          merged.tombstones,
          merged.selection,
        );
        const afterPush = mergeJourneyCloudState({
          localPlans: merged.plans,
          remotePlans: canonical.plans,
          localTombstones: merged.tombstones,
          remoteTombstones: canonical.tombstones,
          localSelection: merged.selection,
          remoteSelection: canonical.selection,
        });
        applyState(afterPush, applyingRemote);

        if (!cancelled) {
          setState("synced");
          setMessage("Trips synced to your VI Guide account");
        }
      } catch (error) {
        applyingRemote.current = false;
        if (!cancelled) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Journey sync failed.");
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    const authenticatedUser = user;

    function schedulePush() {
      if (applyingRemote.current) return;
      if (timer.current) clearTimeout(timer.current);
      setState("syncing");
      setMessage("Saving trip changes…");
      timer.current = setTimeout(async () => {
        try {
          const localPlans = readJourneyPlans();
          const localTombstones = readJourneyTombstones();
          const localSelection = readSelectedTravelerTripSelection();
          const canonical = await push(
            authenticatedUser,
            localPlans,
            localTombstones,
            localSelection,
          );
          const merged = mergeJourneyCloudState({
            localPlans,
            remotePlans: canonical.plans,
            localTombstones,
            remoteTombstones: canonical.tombstones,
            localSelection,
            remoteSelection: canonical.selection,
          });
          applyState(merged, applyingRemote);
          setState("synced");
          setMessage("Trips synced to your VI Guide account");
        } catch (error) {
          applyingRemote.current = false;
          setState("error");
          setMessage(error instanceof Error ? error.message : "Journey sync failed.");
        }
      }, 650);
    }

    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, schedulePush);
    window.addEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, schedulePush);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, schedulePush);
      window.removeEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, schedulePush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user]);

  const Icon =
    state === "syncing"
      ? Loader2
      : state === "error" || state === "local"
        ? CloudOff
        : Cloud;
  const visible = pathname === "/planner" || pathname === "/trips";
  const onPlanner = pathname === "/planner";

  if (!visible) return null;

  return (
    <div
      className={`fixed right-4 z-[9997] sm:right-6 ${onPlanner ? "top-4 sm:top-6" : "top-20 sm:top-24"}`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] shadow-sm ${
          state === "error"
            ? "border-rose-200 bg-rose-100 text-rose-800"
            : state === "synced"
              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
              : onPlanner
                ? "border-white/10 bg-[#043331]/90 text-white/75"
                : "border-slate-200 bg-white text-slate-600"
        }`}
        title={message}
      >
        <Icon className={`h-3.5 w-3.5 ${state === "syncing" ? "animate-spin" : ""}`} />
        {message}
      </div>
    </div>
  );
}

async function push(
  user: User,
  plans: JourneyPlan[],
  tombstones: JourneyTombstone[],
  selection: TravelerTripSelection,
) {
  const token = await user.getIdToken();
  const response = await fetch("/api/journeys", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plans,
      tombstones,
      activePlanId: selection.planId,
      activePlanUpdatedAt: selection.updatedAt,
    }),
  });
  const payload = (await response.json().catch(() => null)) as JourneyApiPayload | null;
  if (!response.ok) throw new Error(payload?.error || "Journey sync failed.");
  return parsePayload(payload);
}

function parsePayload(payload: JourneyApiPayload | null): ParsedJourneyApiPayload {
  const rawPlans = payload?.plans;
  const plans = Array.isArray(rawPlans)
    ? rawPlans.map(normalizeJourneyPlan).filter(isJourneyPlan)
    : [];
  return {
    plans,
    tombstones: normalizeJourneyTombstones(payload?.tombstones),
    selection: normalizeTravelerTripSelection({
      planId: payload?.activePlanId,
      updatedAt: payload?.activePlanUpdatedAt,
    }),
  };
}

function applyState(
  state: ParsedJourneyApiPayload,
  applyingRemote: { current: boolean },
) {
  applyingRemote.current = true;
  try {
    writeJourneyTombstones(state.tombstones);
    writeJourneyPlans(state.plans);
    const currentSelection = readSelectedTravelerTripSelection();
    if (
      currentSelection.planId !== state.selection.planId ||
      currentSelection.updatedAt !== state.selection.updatedAt
    ) {
      writeSelectedTravelerTripPlanId(
        state.selection.planId,
        state.selection.updatedAt || new Date().toISOString(),
      );
    }
  } finally {
    applyingRemote.current = false;
  }
}

function isJourneyPlan(value: JourneyPlan | null): value is JourneyPlan {
  return value !== null;
}
