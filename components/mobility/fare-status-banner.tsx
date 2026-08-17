"use client";

import { AlertTriangle, BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type FareStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "confirmed"; total?: number }
  | { kind: "review"; message: string };

const QUOTE_PATH = "/api/bookings/quote";
const STATUS_EVENT = "vi-guide:fare-status";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FareStatusBanner() {
  const [status, setStatus] = useState<FareStatus>({ kind: "idle" });

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    let latestQuoteRequest = 0;

    const emitStatus = (detail: FareStatus) => {
      window.dispatchEvent(new CustomEvent<FareStatus>(STATUS_EVENT, { detail }));
    };

    const instrumentedFetch: typeof window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const isQuote = url === QUOTE_PATH || url.endsWith(QUOTE_PATH);
      const requestId = isQuote ? ++latestQuoteRequest : 0;

      if (isQuote) emitStatus({ kind: "loading" });

      try {
        const response = await originalFetch(input, init);
        if (isQuote && requestId === latestQuoteRequest) {
          const clone = response.clone();
          const payload = await clone.json().catch(() => null);

          if (response.ok && payload?.fare) {
            emitStatus({
              kind: "confirmed",
              total:
                typeof payload.fare.total === "number"
                  ? payload.fare.total
                  : undefined,
            });
          } else {
            emitStatus({
              kind: "review",
              message:
                typeof payload?.error === "string"
                  ? payload.error
                  : "This route needs dispatch confirmation before a fare can be shown.",
            });
          }
        }
        return response;
      } catch (error) {
        if (
          isQuote &&
          requestId === latestQuoteRequest &&
          !isAbortError(error)
        ) {
          emitStatus({
            kind: "review",
            message:
              error instanceof Error
                ? error.message
                : "The official fare could not be verified. Dispatch confirmation is required.",
          });
        }
        throw error;
      }
    };

    window.fetch = instrumentedFetch;
    const handleStatus = (event: Event) => {
      setStatus((event as CustomEvent<FareStatus>).detail);
    };
    window.addEventListener(STATUS_EVENT, handleStatus);

    return () => {
      window.removeEventListener(STATUS_EVENT, handleStatus);
      if (window.fetch === instrumentedFetch) window.fetch = originalFetch;
    };
  }, []);

  if (status.kind === "idle") return null;

  const confirmed = status.kind === "confirmed";
  const loading = status.kind === "loading";
  const Icon = loading ? Loader2 : confirmed ? BadgeCheck : AlertTriangle;

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4 md:px-6">
      <section
        role={confirmed || loading ? "status" : "alert"}
        aria-live={confirmed || loading ? "polite" : "assertive"}
        aria-atomic="true"
        className={`flex items-start gap-3 rounded-[22px] border p-4 shadow-sm ${
          confirmed
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : loading
              ? "border-slate-200 bg-white text-slate-700"
              : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            confirmed
              ? "bg-emerald-700 text-white"
              : loading
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          <Icon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[.16em]">
            {loading
              ? "Checking published fare"
              : confirmed
                ? "Official fare confirmed"
                : "Fare needs confirmation"}
          </div>
          <p className="mt-1 text-sm font-semibold leading-5">
            {loading
              ? "We are matching this route against the active published USVI taxi tariff."
              : confirmed
                ? `${status.total !== undefined ? `$${status.total.toFixed(2)} · ` : ""}Published tariff matched. No surge or distance estimate was substituted.`
                : status.message}
          </p>
          {!loading && !confirmed ? (
            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-800">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Your route stays selected; no guessed fare will be charged.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
