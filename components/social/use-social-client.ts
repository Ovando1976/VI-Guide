"use client";

import { useMemo } from "react";

import { useAuth } from "@/components/auth-provider";
import { SocialClient } from "@/lib/social/client";

export function useSocialClient() {
  const { user, loading } = useAuth();
  const client = useMemo(
    () => new SocialClient(async () => (user ? user.getIdToken() : null)),
    [user],
  );
  return { client, user, loading };
}
