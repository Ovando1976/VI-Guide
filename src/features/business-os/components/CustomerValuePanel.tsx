import { Crown, DollarSign, ReceiptText, UserRound } from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function CustomerValuePanel({ data }: { data: BusinessOSData }) {
  const customers = data.customers
    .map((customer) => {
      const invoices = data.invoices.filter((invoice) => {
        if (customer.leadId && invoice.leadId === customer.leadId) return true;
        if (invoice.customerName && invoice.customerName === customer.name) return true;
        return false;
      });

      const payments = data.payments.filter((payment) => {
        if (payment.customerName && payment.customerName === customer.name) return true;
        return invoices.some((invoice) => invoice.id === payment.invoiceId);
      });

      const invoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balanceDue = Math.max(invoiced - paid, 0);
      const lifetimeValue = Math.max(customer.lifetimeValue || 0, paid);

      return {
        ...customer,
        invoiced,
        paid,
        balanceDue,
        lifetimeValue,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, 8);

  const totalLifetimeValue = customers.reduce(
    (sum, customer) => sum + customer.lifetimeValue,
    0,
  );

  const totalBalanceDue = customers.reduce(
    (sum, customer) => sum + customer.balanceDue,
    0,
  );

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Customer Value"
        text="Top customers, lifetime value, and unpaid balances."
        icon={Crown}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <Metric icon={DollarSign} label="Customer Value" value={totalLifetimeValue} />
        <Metric icon={ReceiptText} label="Unpaid Balance" value={totalBalanceDue} />
        <Metric icon={UserRound} label="Customers" value={customers.length} plain />
      </div>

      {customers.length === 0 ? (
        <div className="border-t border-white/10 p-8 text-center">
          <UserRound className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No customers yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Convert leads into customers to begin tracking lifetime value.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10 border-t border-white/10">
          {customers.map((customer, index) => (
            <div key={customer.id} className="grid gap-4 p-5 lg:grid-cols-[auto_1fr_auto]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">
                {index + 1}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">{customer.name}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/55">
                    {customer.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/55">
                  Paid ${customer.paid.toLocaleString()} · Invoiced ${customer.invoiced.toLocaleString()}
                </p>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-2xl font-black text-cyan-200">
                  ${customer.lifetimeValue.toLocaleString()}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                  LTV
                </p>

                {customer.balanceDue > 0 ? (
                  <p className="mt-2 text-sm font-bold text-yellow-100">
                    ${customer.balanceDue.toLocaleString()} due
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </BusinessOSCard>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  plain,
}: {
  icon: typeof DollarSign;
  label: string;
  value: number;
  plain?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
      <Icon className="h-6 w-6 text-cyan-300" />

      <p className="mt-4 text-4xl font-black">
        {plain ? value.toLocaleString() : `$${Math.round(value).toLocaleString()}`}
      </p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-white/55">
        {label}
      </p>
    </div>
  );
}