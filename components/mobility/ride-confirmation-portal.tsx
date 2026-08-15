"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RideConfirmationLifecycle } from "@/components/mobility/ride-confirmation-lifecycle";

export function RideConfirmationPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const locateTarget = () => {
      const review = document.getElementById("trip-review");
      if (review) {
        setTarget(review);
        return;
      }
      frame = window.requestAnimationFrame(locateTarget);
    };
    locateTarget();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!target) return null;

  return createPortal(<RideConfirmationLifecycle />, target);
}
