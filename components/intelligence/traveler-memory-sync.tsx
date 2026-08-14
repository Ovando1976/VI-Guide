"use client";

import { useEffect, useRef } from "react";
import type { User } from "firebase/auth";

import { useAuth } from "@/components/auth-provider";
import {
  getIntelligenceMemory,
  getIntelligenceMemoryUpdatedAt,
  INTELLIGENCE_MEMORY_UPDATED_EVENT,
  patchIntelligenceMemory,
} from "@/lib/intelligence/client";
import { setIntelligenceAuthBinding } from "@/lib/intelligence/identity";
import type { IntelligenceMemory } from "@/types/intelligence";

type ProfilePayload = {
  memory?: IntelligenceMemory;
  updatedAt?: string;
  error?: string;
};

export function TravelerMemorySync() {
  const { user, loading } = useAuth();
  const applyingRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIntelligenceAuthBinding(null);
      return;
    }
    const authenticatedUser = user;
    setIntelligenceAuthBinding({
      userId: authenticatedUser.uid,
      getToken: () => authenticatedUser.getIdToken(),
    });
    return () => setIntelligenceAuthBinding(null);
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    const authenticatedUser = user;
    let cancelled = false;

    async function hydrate() {
      try {
        const remote = await readProfile(authenticatedUser);
        if (cancelled) return;
        const local = getIntelligenceMemory();
        const localUpdatedAt = getIntelligenceMemoryUpdatedAt();
        const preferLocal = Boolean(localUpdatedAt && localUpdatedAt > (remote.updatedAt ?? ""));
        const merged = mergeMemory(
          preferLocal ? remote.memory ?? {} : local,
          preferLocal ? local : remote.memory ?? {},
        );
        applyingRemote.current = true;
        patchIntelligenceMemory(merged);
        applyingRemote.current = false;
        await writeProfile(authenticatedUser, merged);
      } catch (error) {
        applyingRemote.current = false;
        console.warn("USVI Explorer traveler memory sync is unavailable.", error);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    const authenticatedUser = user;

    function schedulePush() {
      if (applyingRemote.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void writeProfile(authenticatedUser, getIntelligenceMemory()).catch((error) => {
          console.warn("USVI Explorer could not save traveler memory.", error);
        });
      }, 800);
    }

    window.addEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, schedulePush);
    return () => {
      window.removeEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, schedulePush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user]);

  return null;
}

async function readProfile(user: User): Promise<ProfilePayload> {
  const token = await user.getIdToken();
  const response = await fetch("/api/traveler-profile", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as ProfilePayload | null;
  if (!response.ok) throw new Error(payload?.error || "Traveler profile sync failed.");
  return payload ?? {};
}

async function writeProfile(user: User, memory: IntelligenceMemory) {
  const token = await user.getIdToken();
  const response = await fetch("/api/traveler-profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ memory }),
  });
  const payload = (await response.json().catch(() => null)) as ProfilePayload | null;
  if (!response.ok) throw new Error(payload?.error || "Traveler profile sync failed.");
}

function mergeMemory(base: IntelligenceMemory, preferred: IntelligenceMemory): IntelligenceMemory {
  return {
    ...base,
    ...preferred,
    party: { ...base.party, ...preferred.party },
    preferences: {
      ...base.preferences,
      ...preferred.preferences,
      interests: union(base.preferences?.interests, preferred.preferences?.interests, 24),
      food: union(base.preferences?.food, preferred.preferences?.food, 20),
      avoid: union(base.preferences?.avoid, preferred.preferences?.avoid, 20),
    },
    cruise: { ...base.cruise, ...preferred.cruise },
    activeTrip: preferred.activeTrip ?? base.activeTrip,
    recentPlaceIds: union(base.recentPlaceIds, preferred.recentPlaceIds, 40),
    savedPlaceIds: union(base.savedPlaceIds, preferred.savedPlaceIds, 100),
  };
}

function union(first: string[] | undefined, second: string[] | undefined, limit: number) {
  return Array.from(new Set([...(first ?? []), ...(second ?? [])])).slice(-limit);
}
