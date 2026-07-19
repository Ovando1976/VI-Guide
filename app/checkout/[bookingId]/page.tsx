"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/checkout-form";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const bookingRes = await fetch(`/api/bookings/${bookingId}`);
        const bookingJson = await bookingRes.json();

        if (!bookingRes.ok) {
          throw new Error(bookingJson.error || "Failed to load booking.");
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

        const intentJson = await intentRes.json();

        if (!intentRes.ok) {
          throw new Error(intentJson.error || "Failed to create payment.");
        }

        setClientSecret(intentJson.clientSecret);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Checkout failed."
        );
      }
    }

    if (bookingId) init();
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
    [clientSecret]
  );

  if (errorMessage) {
    return <main className="p-8 text-rose-700">{errorMessage}</main>;
  }

  if (!clientSecret || !options) {
    return <main className="p-8">Loading checkout…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black italic tracking-tight text-[#043331]">
          Complete payment
        </h1>

        <div className="mt-6">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        </div>
      </div>
    </main>
  );
}
