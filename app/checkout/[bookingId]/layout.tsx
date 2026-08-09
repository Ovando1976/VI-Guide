import type { ReactNode } from "react";

import { CheckoutTripWritebackShell } from "@/components/checkout/checkout-trip-writeback-shell";

export default function CheckoutBookingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CheckoutTripWritebackShell />
      {children}
    </>
  );
}