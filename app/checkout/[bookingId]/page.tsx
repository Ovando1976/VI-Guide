"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/checkout-form";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (!publishableKey) {
          throw new Error("Online ride payment is not configured.");
        }

        const bookingRes = await fetch(`/api/bookings/${bookingId}`, {
          cache: "no-store",
        });
        const bookingJson = await bookingRes.json().catch(() => null);

        if (!bookingRes.ok) {
          throw new Error(bookingJson?.error || "Failed to load booking.");
        }

        const intentRes = await fetch("/api/stripe/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
          }),
        });

        const intentJson = await intentRes.json().catch(() => null);

        if (!intentRes.ok || typeof intentJson?.clientSecret !== "string") {
          throw new Error(intentJson?.error || "Failed to create payment.");
        }

        setClientSecret(intentJson.clientSecret);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Checkout failed.",
        );
      }
    }

    if (bookingId) void init();
  }, [bookingId]);

  const options = useMemo<StripeElementsOptions | undefined>(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe",
            },
          }
        : undefined,
    [clientSecret],
  );

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f8f4ea] px-4 py-10 text-[#043331]">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-rose-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-black">Ride checkout unavailable</h1>
          <p className="mt-3 text-sm font-semibold text-rose-700">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (!stripePromise || !clientSecret || !options) {
    return (
      <main className="min-h-screen bg-[#f8f4ea] px-4 py-10 text-[#043331]">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="h-7 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-6 h-64 animate-pulse rounded-[24px] bg-slate-100" />
          <span className="sr-only">Loading ride checkout</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 text-[#043331] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">
          VI Guide Mobility
        </div>
        <h1 className="mt-3 text-3xl font-black italic tracking-tight text-[#043331]">
          Complete payment
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          Secure the quoted island fare, then continue directly into live dispatch and trip tracking.
        </p>

        <div className="mt-7">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm bookingId={bookingId} />
          </Elements>
        </div>
      </div>
    </main>
  );
}
