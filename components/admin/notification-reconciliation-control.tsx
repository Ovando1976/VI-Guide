"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

export function NotificationReconciliationControl() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reconcile() {
    setWorking(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/notification-outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconcile" }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            reconciliation?: {
              scannedBookings?: number;
              candidates?: number;
              created?: number;
            };
            delivery?: {
              delivered?: number;
              deferred?: number;
              skipped?: number;
              failed?: number;
            };
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to reconcile booking notifications.",
        );
      }

      setMessage(
        `${Number(payload?.reconciliation?.scannedBookings ?? 0)} bookings scanned · ${Number(payload?.reconciliation?.created ?? 0)} missing messages created · ${Number(payload?.delivery?.delivered ?? 0)} delivered · ${Number(payload?.delivery?.deferred ?? 0)} deferred. Refresh the queue to review the latest state.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reconcile booking notifications.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-700">
            Financial recovery
          </p>
          <p className="mt-1 max-w-3xl text-sm font-bold leading-5 text-amber-950/75">
            Scan recent commerce bookings for Stripe-paid, refund, confirmation,
            completion, cancellation, or decline events that do not yet have a
            durable email record.
          </p>
          {message ? (
            <p className="mt-2 text-xs font-bold leading-5 text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs font-bold leading-5 text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={working}
          onClick={() => void reconcile()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
        >
          {working ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Reconcile bookings
        </button>
      </div>
    </section>
  );
}
