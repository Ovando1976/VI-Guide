"use client";

import { useEffect } from "react";

import { canonicalGovernorAnchorId } from "@/lib/heritage/governor-anchor-aliases";

export function GovernorAnchorBridge() {
  useEffect(() => {
    function alignGovernorAnchor() {
      const rawHash = window.location.hash.slice(1);
      if (!rawHash) return;

      let requestedId = rawHash;
      try {
        requestedId = decodeURIComponent(rawHash);
      } catch {
        // Keep the raw fragment when it is not valid URI-encoded text.
      }

      const canonicalId = canonicalGovernorAnchorId(requestedId);
      const target = document.getElementById(canonicalId);
      if (!target) return;

      if (canonicalId !== requestedId) {
        const url = `${window.location.pathname}${window.location.search}#${encodeURIComponent(canonicalId)}`;
        window.history.replaceState(window.history.state, "", url);
      }

      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
      });
    }

    alignGovernorAnchor();
    window.addEventListener("hashchange", alignGovernorAnchor);
    return () => window.removeEventListener("hashchange", alignGovernorAnchor);
  }, []);

  return null;
}
