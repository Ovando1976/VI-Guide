"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { normalizeActiveIsland, writeActiveIsland } from "@/lib/active-island";

export function ActiveIslandRouteSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const island = normalizeActiveIsland(searchParams.get("island"));

  useEffect(() => {
    if (island) writeActiveIsland(island);
  }, [island, pathname]);

  return null;
}
