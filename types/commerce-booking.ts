import type { IntelligenceIsland } from "@/types/intelligence";

export type CommerceBookingKind = "accommodation" | "tour" | "experience";

export type CommerceBookingStatus =
  | "draft"
  | "requested"
  | "reviewing"
  | "confirmed"
  | "declined"
  | "cancelled";

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
  paymentHref?: string;
  createdAt: string;
  updatedAt: string;
};
