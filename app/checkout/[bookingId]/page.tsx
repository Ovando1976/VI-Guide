"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

import { CheckoutForm } from "@/components/checkout-form";
import { RideConfirmationLifecycle } from "@/components/mobility/ride-confirmation-lifecycle";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CheckoutBooking = {
  id: string;
  paymentStatus?: string;
  paymentIntegrityStatus?: string;
  financialHoldStatus?: string;
  cancellationStatus?: string;
  amountCaptured?: number | null;
  refund?: { status?: string } | null;
  dispute?: { status?: string } | null;
  status?: string;
  island?: string;
  origin?: { estateName?: string };
  destination?: { estateName?: string };
  quotedFare?: { total?: number };
};

export default function CheckoutBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<CheckoutBooking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function init() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setClientSecret(null);

        if (!publishableKey) {
          throw new Error("Online ride payment is not configured.");
        }

        const bookingRes = await fetch(`/api/bookings/${bookingId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const bookingJson = await bookingRes.json().catch(() => null);

        if (!bookingRes.ok || !bookingJson?.booking) {
          throw new Error(bookingJson?.error || "Failed to load booking.");
        }

        const loadedBooking = bookingJson.booking as CheckoutBooking;
        setBooking(loadedBooking);

        if (
          loadedBooking.paymentStatus === "paid" ||
          Number(loadedBooking.amountCaptured ?? 0) > 0 ||
          isProtectedBooking(loadedBooking)
        ) {
          router.replace(
            `/trips?booking=${encodeURIComponent(bookingId)}&payment=return`,
          );
          return;
        }

        const intentRes = await fetch(
          `/api/bookings/${encodeURIComponent(bookingId)}/payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          },
        );
        const intentJson = await intentRes.json().catch(() => null);

        if (
          intentJson?.alreadyPaid === true ||
          intentJson?.reviewRequired === true ||
          intentJson?.paymentPending === true ||
          intentJson?.code === "PAYMENT_LIFECYCLE_BLOCKED" ||
          intentJson?.code === "PAYMENT_REVIEW_REQUIRED"
        ) {
          router.replace(
            `/trips?booking=${encodeURIComponent(bookingId)}&payment=return`,
          );
          return;
        }

        if (!intentRes.ok) {
          throw new Error(
            intentJson?.error || "Failed to initialize secure payment.",
          );
        }

        if (typeof intentJson?.clientSecret !== "string") {
          throw new Error("Failed to initialize secure payment.");
        }

        setClientSecret(intentJson.clientSecret);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Checkout failed.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (bookingId) void init();
    return () => controller.abort();
  }, [bookingId, reloadNonce, router]);

  const options = useMemo<StripeElementsOptions | undefined>(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#075e58",
                colorText: "#043331",
                borderRadius: "14px",
              },
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
          <p className="mt-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setReloadNonce((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-xs font-black uppercase tracking-[.15em] text-white"
            >
              <RefreshCw size={15} /> Try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/mobility")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[.15em]"
            >
              <ArrowLeft size={15} /> Back to ride
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (loading || !stripePromise || !clientSecret || !options) {
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

  const total = Number(booking?.quotedFare?.total ?? 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.12),transparent_30%),linear-gradient(180deg,#f8f4ea,#ffffff)] px-4 py-8 text-[#043331] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(4,51,49,.12)]">
        <div className="bg-[linear-gradient(135deg,#032d2b,#075e58)] p-6 text-white sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778]">
            <ShieldCheck size={15} /> Secure USVI Explorer payment
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-4xl">
            Pay your ride request securely
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/68">
            Payment submits this request into dispatch. Your ride is confirmed only after an authorized operator is assigned.
          </p>
          {booking ? (
            <div className="mt-5 grid gap-3 rounded-[22px] border border-white/10 bg-white/[.07] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">
                  Booking {bookingId.slice(0, 8)}
                </div>
                <div className="mt-1 text-sm font-black">
                  {booking.origin?.estateName || "Pickup"} →{" "}
                  {booking.destination?.estateName || "Destination"}
                </div>
              </div>
              <div className="text-2xl font-black text-[#f7d778]">
                {total > 0 ? `$${total.toFixed(2)}` : "Quoted fare"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          <RideConfirmationLifecycle />
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-4 text-sm font-semibold leading-6 text-slate-600">
            After successful payment, USVI Explorer returns you to <strong className="text-[#043331]">My Trip</strong>, where the live timeline shows whether dispatch is still matching your ride, a driver has been assigned, the driver is en route, or the trip has started.
          </div>
          <div className="mt-6">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm bookingId={bookingId} />
            </Elements>
          </div>
        </div>
      </div>
    </main>
  );
}

function isProtectedBooking(booking: CheckoutBooking) {
  return Boolean(
    booking.status === "cancelled" ||
      booking.status === "completed" ||
      booking.paymentStatus === "refunded" ||
      booking.paymentIntegrityStatus === "review_required" ||
      booking.cancellationStatus === "processing" ||
      booking.cancellationStatus === "review_required" ||
      (booking.refund && booking.refund.status !== "not_required") ||
      booking.dispute ||
      (booking.financialHoldStatus && booking.financialHoldStatus !== "none"),
  );
}
