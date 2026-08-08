"use client";

import { useEffect } from "react";
import { trackAcquisitionEvent } from "@/lib/acquisition-client";
import type { AcquisitionEventName } from "@/lib/acquisition";

export function AcquisitionEvent({ name, properties }: { name: AcquisitionEventName; properties?: Record<string, string | number | boolean | null> }) {
  useEffect(() => { trackAcquisitionEvent(name, properties); }, [name, properties]);
  return null;
}
