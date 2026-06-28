import type { BusinessLeadStatus } from "../../../lib/firestore/businesses";
import type { BusinessOSData } from "../types";
import CustomerValuePanel from "./CustomerValuePanel";
import BusinessCustomerProfile from "./BusinessCustomerProfile";
import CustomerTimeline from "./CustomerTimeline";
import LeadCRM from "./LeadCRM";

export default function BusinessCustomersCenter({
  data,
  updatingLeadId,
  onChangeLeadStatus,
    onRefresh,
}: {
  data: BusinessOSData;
  updatingLeadId: string | null;
  onChangeLeadStatus: (leadId: string, status: BusinessLeadStatus) => void;
  onRefresh: () => void;
}) {
  const customers = data.customers
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 6);

  return (
    <section className="space-y-6">
      <LeadCRM
         data={data}
         updatingLeadId={updatingLeadId}
         onChangeLeadStatus={onChangeLeadStatus}
         onRefresh={onRefresh}
        />

      {customers.map((customer) => (
        <BusinessCustomerProfile
          key={customer.id}
          customer={customer}
          data={data}
        />
      ))}

      <CustomerTimeline data={data} />
      <CustomerValuePanel data={data} />
    </section>
  );
}