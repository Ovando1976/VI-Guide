"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  normalizeJourneyPlan,
  readJourneyPlans,
  writeJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";

type SyncState = "local" | "syncing" | "synced" | "error";

export function JourneyCloudSync() {
  const { user, loading: authLoading } = useAuth();
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

    let cancelled = false;

    async function hydrate() {
      setState("syncing");
      setMessage("Syncing saved journeys…");
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/journeys", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { plans?: unknown; error?: string }
          | null;
        if (!response.ok) throw new Error(payload?.error || "Journey sync failed.");
        const remote = Array.isArray(payload?.plans)
          ? payload.plans.map(normalizeJourneyPlan).filter(isJourneyPlan)
          : [];
        const merged = mergePlans(readJourneyPlans(), remote);
        applyingRemote.current = true;
        writeJourneyPlans(merged);
        applyingRemote.current = false;
        await push(user, merged);
        if (!cancelled) {
          setState("synced");
          setMessage("Synced to your VI Guide account");
        }
      } catch (error) {
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

    function schedulePush() {
      if (applyingRemote.current) return;
      if (timer.current) clearTimeout(timer.current);
      setState("syncing");
      setMessage("Saving journey…");
      timer.current = setTimeout(async () => {
        try {
          await push(user, readJourneyPlans());
          setState("synced");
          setMessage("Synced to your VI Guide account");
        } catch (error) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Journey sync failed.");
        }
      }, 650);
    }

    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, schedulePush);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, schedulePush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user]);

  const Icon = state === "syncing" ? Loader2 : state === "error" || state === "local" ? CloudOff : Cloud;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] ${
        state === "error"
          ? "bg-rose-100 text-rose-800"
          : state === "synced"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-white/10 text-white/70"
      }`}
      title={message}
    >
      <Icon className={`h-3.5 w-3.5 ${state === "syncing" ? "animate-spin" : ""}`} />
      {message}
    </div>
  );
}

async function push(user: NonNullable<ReturnType<typeof useAuth>["user"]>, plans: JourneyPlan[]) {
  const token = await user.getIdToken();
  const response = await fetch("/api/journeys", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plans }),
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error || "Journey sync failed.");
}

function mergePlans(local: JourneyPlan[], remote: JourneyPlan[]) {
  const merged = new Map<string, JourneyPlan>();
  for (const plan of [...local, ...remote]) {
    const existing = merged.get(plan.id);
    if (!existing || plan.updatedAt > existing.updatedAt) merged.set(plan.id, plan);
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function isJourneyPlan(value: JourneyPlan | null): value is JourneyPlan {
  return value !== null;
}
