import type { IntelligenceIsland } from "@/types/intelligence";

export type CommerceBookingKind = "accommodation" | "tour" | "experience";

export type CommerceBookingStatus =
  | "draft"
  | "requested"
  | "reviewing"
  | "payment_required"
  | "paid"
  | "confirmed"
  | "completed"
  | "declined"
  | "cancelled";

export type CommercePaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refund_pending"
  | "refunded"
  | "refund_failed";

export type CommerceBookingRequest = {
  kind: CommerceBookingKind;
  listingId: string;
  listingName: string;
  listingHref?: string;
  island: IntelligenceIsland;
  startDate: string;
  endDate?: string;
  preferredTime?: string;
  adults: number;
  children: number;
  guestName: string;
  email: string;
  phone?: string;
  notes?: string;
};

export type CommerceBooking = CommerceBookingRequest & {
  id: string;
  status: CommerceBookingStatus;
  reference: string;
  depositAmountCents?: number;
  paidAmountCents?: number;
  paymentStatus?: CommercePaymentStatus;
  paymentHref?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};
