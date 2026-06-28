import { CreditCard, DollarSign, ReceiptText, Wallet } from "lucide-react";

import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function PaymentsPanel({ data }: { data: BusinessOSData }) {
  const collected = data.payments.reduce((sum, payment) => {
    return payment.status === "completed" ? sum + payment.amount : sum;
  }, 0);

  const invoiced = data.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const outstanding = data.invoices.reduce(
    (sum, invoice) => sum + Math.max(invoice.balanceDue || 0, 0),
    0,
  );

  const recentPayments = data.payments
    .slice()
    .sort((a, b) => (b.paidAt || b.createdAt || 0) - (a.paidAt || a.createdAt || 0))
    .slice(0, 8);

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Payments Panel"
        text="Collected revenue, outstanding balances, and recent payment activity."
        icon={Wallet}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <MoneyCard icon={DollarSign} label="Collected" value={collected} featured />
        <MoneyCard icon={ReceiptText} label="Invoiced" value={invoiced} />
        <MoneyCard icon={CreditCard} label="Outstanding" value={outstanding} />
      </div>

      {recentPayments.length === 0 ? (
        <div className="border-t border-white/10 p-8 text-center">
          <Wallet className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No payments yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Payments recorded from invoices will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10 border-t border-white/10">
          {recentPayments.map((payment) => (
            <div key={payment.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-white">
                    {payment.customerName || "Manual payment"}
                  </h3>

                  <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase text-cyan-100">
                    {payment.status}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/60">
                  {payment.notes || `Payment method: ${payment.method || "manual"}`}
                </p>
              </div>

              <p className="text-3xl font-black text-cyan-200">
                ${payment.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </BusinessOSCard>
  );
}

function MoneyCard({
  icon: Icon,
  label,
  value,
  featured,
}: {
  icon: typeof DollarSign;
  label: string;
  value: number;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        featured
          ? "border-cyan-300/30 bg-cyan-300/15"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <Icon className="h-6 w-6 text-cyan-300" />

      <p className="mt-4 text-4xl font-black">
        ${Math.round(value).toLocaleString()}
      </p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-white/55">
        {label}
      </p>
    </div>
  );
}