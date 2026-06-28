import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

import {
  getBusinessAnalytics,
  getBusinessAnalyticsForBusinessIds,
  getBusinessLeadsForBusinessIds,
  getBusinesses,
  getBusinessesForOwner,
  updateBusinessLeadStatus,
  type BusinessAnalytics,
  type BusinessLeadStatus,
} from "../lib/firestore/businesses";
import {
  getBusinessAppointmentsForBusinessIds,
  getBusinessNotificationsForBusinessIds,
  getBusinessTasksForBusinessIds,
  getBusinessTimelineForBusinessIds,
  type BusinessAppointment,
  type BusinessNotification,
  type BusinessTask,
  type BusinessTimelineEvent,
} from "../features/business-os/firestore";
import {
  getBusinessEstimatesForBusinessIds,
  getBusinessInvoicesForBusinessIds,
  getBusinessPaymentsForBusinessIds,
  type BusinessEstimate,
  type BusinessInvoice,
  type BusinessPayment,
} from "../features/business-os/money";
import type { UserProfile } from "../types";
import type { Business, BusinessLead } from "../types/business";
import BusinessCommandCenter from "../features/business-os/components/BusinessCommandCenter";
import { buildBusinessOSData } from "../features/business-os/utils";
import {
  getBusinessJobsForBusinessIds,
  type BusinessJob,
} from "../features/business-os/jobs";

type Props = {
  user: User | null;
  profile: UserProfile | null;
};

export default function MerchantDashboard({ user, profile }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalytics[]>([]);
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<BusinessTask[]>([]);
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [timeline, setTimeline] = useState<BusinessTimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);

  const [estimates, setEstimates] = useState<BusinessEstimate[]>([]);
  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [payments, setPayments] = useState<BusinessPayment[]>([]);
  const [jobs, setJobs] = useState<BusinessJob[]>([]);

  const isAdmin = profile?.role === "admin";

  async function loadDashboard() {
  setLoading(true);

  try {
    const businessRows =
      isAdmin || !user
        ? await getBusinesses()
        : await getBusinessesForOwner(user.uid);

    const businessIds = businessRows.map((business) => business.id);

    const [
  taskRows,
  jobRows,
  appointmentRows,
  timelineRows,
  notificationRows,
  estimateRows,
  invoiceRows,
  paymentRows,
  analyticsRows,
  leadRows,
] = await Promise.all([
  getBusinessTasksForBusinessIds(businessIds).catch(() => []),
  getBusinessJobsForBusinessIds(businessIds).catch(() => []),
  getBusinessAppointmentsForBusinessIds(businessIds).catch(() => []),
  getBusinessTimelineForBusinessIds(businessIds).catch(() => []),
  getBusinessNotificationsForBusinessIds(businessIds).catch(() => []),
  getBusinessEstimatesForBusinessIds(businessIds).catch(() => []),
  getBusinessInvoicesForBusinessIds(businessIds).catch(() => []),
  getBusinessPaymentsForBusinessIds(businessIds).catch(() => []),
  (isAdmin
    ? getBusinessAnalytics()
    : getBusinessAnalyticsForBusinessIds(businessIds)
  ).catch(() => []),
  getBusinessLeadsForBusinessIds(businessIds).catch(() => []),
]);

    setBusinesses(businessRows);
    setAnalytics(analyticsRows);
    setLeads(leadRows);
    setTasks(taskRows);
    setJobs(jobRows);
    setAppointments(appointmentRows);
    setTimeline(timelineRows);
    setEstimates(estimateRows);
    setInvoices(invoiceRows);
    setPayments(paymentRows);
    setNotifications(notificationRows);
  } catch (error) {
    console.error("Failed to load merchant dashboard:", error);
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  void loadDashboard();
}, [isAdmin, user?.uid]);

  const businessOSData = useMemo(
  () =>
    buildBusinessOSData({
      businesses,
      analytics,
      leads,
      tasks,
      jobs,
      appointments,
      timeline,
      estimates,
      invoices,
      payments,
      notifications,
    }),
  [
    businesses,
    analytics,
    leads,
    tasks,
    appointments,
    timeline,
    estimates,
    invoices,
    payments,
    notifications,
  ],
);

  async function changeLeadStatus(leadId: string, status: BusinessLeadStatus) {
    try {
      setUpdatingLeadId(leadId);
      await updateBusinessLeadStatus(leadId, status);

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, status } : lead,
        ),
      );
    } catch (error) {
      console.error("Failed to update lead status:", error);
    } finally {
      setUpdatingLeadId(null);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#061016] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
          <p className="mt-4 font-bold text-white/75">Loading Business OS...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061016] pb-40 text-white">
      <BusinessCommandCenter
        data={businessOSData}
        isAdmin={isAdmin}
        updatingLeadId={updatingLeadId}
        onChangeLeadStatus={(leadId, status) =>
          void changeLeadStatus(leadId, status)
         }
        onRefresh={() => void loadDashboard()}
      />
    </main>
  );
}