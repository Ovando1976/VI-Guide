import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const checkoutLayout = source("app/checkout/layout.tsx");
const checkoutLanding = source("app/checkout/page.tsx");
const rideCheckout = source("app/checkout/[bookingId]/page.tsx");
const checkoutForm = source("components/checkout-form.tsx");

assert.match(checkoutLayout, /ViPublicHeader/);
assert.match(checkoutLayout, /actionHref="\/bookings"/);
assert.match(checkoutLayout, /secondaryHref="\/trips"/);

assert.match(checkoutLanding, /VI Guide secure payment hub/);
assert.match(checkoutLanding, /Pay from the booking that created the charge\./);
assert.match(checkoutLanding, /Ride payment/);
assert.match(checkoutLanding, /Stays, tours & experiences/);
assert.match(checkoutLanding, /primaryHref="\/trips"/);
assert.match(checkoutLanding, /primaryHref="\/bookings"/);
assert.match(checkoutLanding, /territory context/);

assert.match(rideCheckout, /Complete your ride payment/);
assert.match(rideCheckout, /\/api\/bookings\/\$\{bookingId\}/);
assert.match(rideCheckout, /payment-intent/);
assert.match(rideCheckout, /isProtectedBooking/);
assert.match(rideCheckout, /paymentStatus === "paid"/);
assert.match(rideCheckout, /paymentIntegrityStatus === "review_required"/);
assert.match(rideCheckout, /financialHoldStatus/);
assert.match(rideCheckout, /router\.replace/);
assert.match(rideCheckout, /\/trips\?booking=/);

assert.match(checkoutForm, /stripe\.confirmPayment/);
assert.match(checkoutForm, /returnUrl = new URL\("\/trips"/);
assert.match(checkoutForm, /returnUrl\.searchParams\.set\("booking", bookingId\)/);
assert.match(checkoutForm, /returnUrl\.searchParams\.set\("payment", "return"\)/);
assert.match(checkoutForm, /Pay and track ride/);

console.log("VI Guide checkout journey boundary contracts passed.");
