export type NotificationAudience = "traveler" | "merchant" | "operations";

export type NotificationKind =
  | "booking"
  | "mission"
  | "provider"
  | "concierge"
  | "trip"
  | "operations";

export type NotificationPriority = "normal" | "high";

export type ViNotification = {
  id: string;
  audience: NotificationAudience;
  recipientUid?: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  title: string;
  message: string;
  href?: string;
  reference?: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
