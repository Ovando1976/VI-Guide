"use client";

import { useEffect, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

import { trackAcquisitionEvent } from "@/lib/acquisition-client";

export function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    trackAcquisitionEvent("checkout_started", { bookingId });
  }, [bookingId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setMessage(null);

    const returnUrl = new URL("/trips", window.location.origin);
    returnUrl.searchParams.set("booking", bookingId);
    returnUrl.searchParams.set("payment", "return");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message ?? "Payment failed.");
        return;
      }

      // This records a successful client confirmation. Financial truth remains
      // the server-side Stripe verification/webhook lifecycle.
      trackAcquisitionEvent("purchase_completed", { bookingId, product: "ride" });
      window.location.assign(returnUrl.toString());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Secure payment could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-full bg-[#043331] px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {submitting ? "Processing…" : "Pay and track ride"}
      </button>
      <p className="text-center text-xs font-semibold leading-5 text-slate-500">
        After payment, USVI Explorer verifies the Stripe record before opening dispatch and live trip tracking.
      </p>
      {message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {message}
        </div>
      ) : null}
    </form>
  );
}
