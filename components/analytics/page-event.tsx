"use client";

import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics/tracking-client";
import type {
  ClientVIEventName,
  VIEventContext,
  VIEventPayload,
} from "@/lib/analytics/vi-event";

export function PageEvent({
  eventName,
  payload = {},
  context = {},
}: {
  eventName: ClientVIEventName;
  payload?: VIEventPayload;
  context?: VIEventContext;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(eventName, payload, context);
  }, [context, eventName, payload]);

  return null;
}
