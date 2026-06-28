import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  markBusinessNotificationRead,
  type BusinessNotification,
} from "../firestore";
import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type AlertTone = "danger" | "warning" | "success" | "info";

type BusinessAlert = {
  id: string;
  title: string;
  text: string;
  tone: AlertTone;
  icon: LucideIcon;
  source: "firestore" | "system";
  read?: boolean;
};

export default function NotificationCenter({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const alerts = useMemo(
    () =>
      data.notifications.length > 0
        ? buildLiveNotifications(data, readIds)
        : buildSystemAlerts(data),
    [data, readIds],
  );

  const unreadCount = alerts.filter((alert) => alert.source === "firestore" && !alert.read).length;

  async function markRead(alert: BusinessAlert) {
    if (alert.source !== "firestore" || alert.read) return;

    setUpdatingId(alert.id);
    setNotice(null);

    try {
      await markBusinessNotificationRead(alert.id);
      setReadIds((current) => {
        const next = new Set(current);
        next.add(alert.id);
        return next;
      });
      onRefresh?.();
    } catch (error) {
      console.error("Failed to mark notification read:", error);
      setNotice("Notification could not be marked read.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Notification Center"
        text={
          unreadCount > 0
            ? `${unreadCount} unread business notification${unreadCount === 1 ? "" : "s"}.`
            : "Business alerts, reminders, AI recommendations, and customer activity."
        }
        icon={Bell}
      />

      {notice ? (
        <div className="border-b border-white/10 p-5">
          <p className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100">
            {notice}
          </p>
        </div>
      ) : null}

      {alerts.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <h3 className="mt-4 text-2xl font-black">Everything looks good</h3>
          <p className="mt-2 text-sm text-white/60">
            No urgent notifications right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-5 lg:grid-cols-2">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              updating={updatingId === alert.id}
              onMarkRead={() => void markRead(alert)}
            />
          ))}
        </div>
      )}
    </BusinessOSCard>
  );
}

function buildLiveNotifications(
  data: BusinessOSData,
  readIds: Set<string>,
): BusinessAlert[] {
  return data.notifications
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 20)
    .map((notification: BusinessNotification) => ({
      id: notification.id,
      title: notification.title,
      text: notification.message,
      tone: toneForNotification(notification.type),
      icon: iconForNotification(notification.type),
      source: "firestore",
      read: notification.read || readIds.has(notification.id),
    }));
}

function toneForNotification(type?: string): AlertTone {
  switch (type) {
    case "success":
      return "success";
    case "warning":
    case "premium":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "info";
  }
}

function buildSystemAlerts(data: BusinessOSData): BusinessAlert[] {
  const alerts: BusinessAlert[] = [];

  if (data.leadStats.new > 0) {
    alerts.push({
      id: "new-leads",
      title: `${data.leadStats.new} new lead${data.leadStats.new === 1 ? "" : "s"} waiting`,
      text: "Respond within 15 minutes for the highest conversion rate.",
      tone: "warning",
      icon: Mail,
      source: "system",
    });
  }

  if (data.leadStats.contacted > 0) {
    alerts.push({
      id: "followups",
      title: `${data.leadStats.contacted} follow-up${data.leadStats.contacted === 1 ? "" : "s"} overdue`,
      text: "Continue nurturing these leads before they go cold.",
      tone: "info",
      icon: Bell,
      source: "system",
    });
  }

  if (data.winRate >= 50) {
    alerts.push({
      id: "growth",
      title: `${data.winRate}% conversion rate`,
      text: "Excellent performance. Increase advertising to scale revenue.",
      tone: "success",
      icon: TrendingUp,
      source: "system",
    });
  }

  if (data.featuredCount === 0 && data.businesses.length > 0) {
    alerts.push({
      id: "premium",
      title: "No Premium Listings",
      text: "Premium businesses can dramatically increase platform revenue.",
      tone: "warning",
      icon: Crown,
      source: "system",
    });
  }

  if (data.totals.profileViews > 0 && data.totals.leadCount === 0) {
    alerts.push({
      id: "conversion",
      title: "Traffic isn't converting",
      text: "Improve photos, CTA buttons, reviews, and booking forms.",
      tone: "danger",
      icon: AlertTriangle,
      source: "system",
    });
  }

  return alerts;
}

function iconForNotification(type?: string): LucideIcon {
  switch (type) {
    case "lead":
      return Mail;
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "growth":
      return TrendingUp;
    case "premium":
      return Crown;
    default:
      return Bell;
  }
}

function AlertCard({
  alert,
  updating,
  onMarkRead,
}: {
  alert: BusinessAlert;
  updating: boolean;
  onMarkRead: () => void;
}) {
  const Icon = alert.icon;

  const tone =
    alert.tone === "danger"
      ? "border-red-300/20 bg-red-300/10 text-red-100"
      : alert.tone === "warning"
        ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
        : alert.tone === "success"
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${tone} ${alert.read ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-6 w-6" />

        {alert.source === "firestore" ? (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={updating || alert.read}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase disabled:opacity-45"
          >
            {updating ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving
              </span>
            ) : alert.read ? (
              "Read"
            ) : (
              "Mark Read"
            )}
          </button>
        ) : null}
      </div>

      <h3 className="mt-4 text-xl font-black">{alert.title}</h3>

      <p className="mt-2 text-sm leading-relaxed opacity-80">{alert.text}</p>
    </div>
  );
}