"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RideConfirmationLifecycle } from "@/components/mobility/ride-confirmation-lifecycle";

export function RideConfirmationPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncTarget = () => {
      setTarget(document.getElementById("trip-review"));
    };

    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(<RideConfirmationLifecycle />, target);
}
