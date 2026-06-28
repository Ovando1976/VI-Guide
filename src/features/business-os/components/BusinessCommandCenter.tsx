import type { BusinessLeadStatus } from "../../../lib/firestore/businesses";
import type { BusinessOSData } from "../types";

import AIBusinessCoach from "./AIBusinessCoach";
import BusinessCustomersCenter from "./BusinessCustomersCenter";
import BusinessListingsPanel from "./BusinessListingsPanel";
import BusinessMoneyCenter from "./BusinessMoneyCenter";
import BusinessOperationsCenter from "./BusinessOperationsCenter";
import BusinessOSNav from "./BusinessOSNav";
import BusinessReportsCenter from "./BusinessReportsCenter";
import ExecutiveOverview from "./ExecutiveOverview";
import LeadSourceRevenue from "./LeadSourceRevenue";
import PerformanceGrid from "./PerformanceGrid";
import QuickActionsPanel from "./QuickActionsPanel";
import RevenueAnalytics from "./RevenueAnalytics";
import BusinessSection from "./BusinessSection";
import BusinessOSStatusBar from "./BusinessOSStatusBar";

export default function BusinessCommandCenter({
  data,
  isAdmin,
  updatingLeadId,
  onChangeLeadStatus,
  onRefresh = () => {},
}: {
  data: BusinessOSData;
  isAdmin: boolean;
  updatingLeadId: string | null;
  onChangeLeadStatus: (leadId: string, status: BusinessLeadStatus) => void;
  onRefresh?: () => void;
}) {
  return (
    <>
      <ExecutiveOverview data={data} isAdmin={isAdmin} />
      <BusinessOSNav />
      <BusinessOSStatusBar data={data} />

      <section className="mx-auto max-w-6xl space-y-6 px-5 py-6 sm:px-8">
        <PerformanceGrid data={data} />

<BusinessSection
  id="business-reports"
  title="Business Reports"
  description="Executive overview of revenue, customers, profitability, platform activity, and growth."
>
  <BusinessReportsCenter data={data} />
</BusinessSection>

<QuickActionsPanel data={data} />
<RevenueAnalytics data={data} />
<LeadSourceRevenue data={data} />
<AIBusinessCoach data={data} />

<BusinessSection
  id="business-money"
  title="Money Center"
  description="Estimates, invoices, payments, outstanding balances, and cash flow."
>
  <BusinessMoneyCenter data={data} onRefresh={onRefresh} />
</BusinessSection>

<BusinessSection
  id="business-operations"
  title="Operations Center"
  description="Tasks, appointments, notifications, customer activity, and daily follow-up."
>
  <BusinessOperationsCenter data={data} onRefresh={onRefresh} />
</BusinessSection>

<BusinessSection
  id="business-customers"
  title="Customer Center"
  description="Lead management, customer profiles, lifetime value, and customer history."
>
  <BusinessCustomersCenter
    data={data}
    updatingLeadId={updatingLeadId}
    onChangeLeadStatus={onChangeLeadStatus}
    onRefresh={onRefresh}
  />
</BusinessSection>

<BusinessSection
  id="business-listings"
  title="Business Listings"
  description="Manage listings, visibility, verification, claims, and platform presence."
>
  <BusinessListingsPanel data={data} isAdmin={isAdmin} />
</BusinessSection>
      </section>
    </>
  );
}