import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata = {
  title: "Notifications | USVI Explorer",
  description:
    "Review booking, mission, provider, Concierge, and operations notifications in one live inbox.",
};

export default function NotificationsPage() {
  return <NotificationCenter audience="traveler" />;
}
