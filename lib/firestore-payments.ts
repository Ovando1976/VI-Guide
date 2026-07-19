import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RideBookingPaymentStatus } from "@/types/mobility";

export async function updateBookingPayment(params: {
  bookingId: string;
  paymentStatus: RideBookingPaymentStatus;
  paymentIntentId?: string | null;
  amountAuthorized?: number | null;
  amountCaptured?: number | null;
}) {
  await updateDoc(doc(db, "bookings", params.bookingId), {
    paymentStatus: params.paymentStatus,
    paymentIntentId: params.paymentIntentId ?? null,
    ...(typeof params.amountAuthorized === "number"
      ? { amountAuthorized: params.amountAuthorized }
      : {}),
    ...(typeof params.amountCaptured === "number"
      ? { amountCaptured: params.amountCaptured }
      : {}),
    updatedAt: serverTimestamp(),
  });
}