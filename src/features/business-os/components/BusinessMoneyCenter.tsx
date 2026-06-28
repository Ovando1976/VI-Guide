import type { BusinessOSData } from "../types";

import EstimateBuilder from "./EstimateBuilder";
import InvoiceBuilder from "./InvoiceBuilder";
import PaymentsPanel from "./PaymentsPanel";
import RevenueForecast from "./RevenueForecast";

export default function BusinessMoneyCenter({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  return (
    <section className="space-y-6">
      <RevenueForecast data={data} />
      <EstimateBuilder data={data} onRefresh={onRefresh} />
      <InvoiceBuilder data={data} onRefresh={onRefresh} />
      <PaymentsPanel data={data} />
    </section>
  );
}