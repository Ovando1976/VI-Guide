export type BookingPaymentStatus =
  | "unpaid"
  | "requires_payment_method"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export type CreatePaymentIntentInput = {
  bookingId: string;
  amount: number; // cents
  currency?: string;
  riderId: string;
  description?: string;
};