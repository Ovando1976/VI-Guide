import {
  CalendarDays,
  DollarSign,
  FileText,
  Mail,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";

import type { BusinessCustomer } from "../customers";
import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function BusinessCustomerProfile({
  customer,
  data,
}: {
  customer: BusinessCustomer;
  data: BusinessOSData;
}) {
  const business = data.businessById.get(customer.businessId);

  const tasks = data.tasks.filter(
    (task) => task.leadId && task.leadId === customer.leadId,
  );

  const appointments = data.appointments.filter(
    (item) => item.leadId && item.leadId === customer.leadId,
  );

  const estimates = data.estimates.filter(
    (item) => item.leadId && item.leadId === customer.leadId,
  );

  const invoices = data.invoices.filter(
    (item) => item.leadId && item.leadId === customer.leadId,
  );

  const payments = data.payments.filter(
    (payment) =>
      invoices.some((invoice) => invoice.id === payment.invoiceId) ||
      payment.customerName === customer.name,
  );

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = Math.max(totalInvoiced - totalPaid, 0);

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Customer Profile"
        text="A complete customer relationship view across leads, tasks, appointments, estimates, invoices, and payments."
        icon={UserRound}
      />

      <section className="border-b border-white/10 p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-black">{customer.name}</h2>

              <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase text-cyan-100">
                {customer.status}
              </span>

              {business ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                  {business.name}
                </span>
              ) : null}
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
              {customer.notes || "No customer notes yet."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {customer.phone ? (
                <ContactPill icon={Phone} label={customer.phone} href={`tel:${customer.phone}`} />
              ) : null}

              {customer.email ? (
                <ContactPill icon={Mail} label={customer.email} href={`mailto:${customer.email}`} />
              ) : null}

              <ContactPill
                icon={CalendarDays}
                label={`Last contact ${formatDate(customer.lastContactAt || customer.updatedAt)}`}
              />
            </div>
          </div>

          <div className="grid min-w-[16rem] gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <MoneyStat label="Lifetime Value" value={customer.lifetimeValue || totalPaid} />
            <MoneyStat label="Paid" value={totalPaid} />
            <MoneyStat label="Balance Due" value={balanceDue} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 p-5 lg:grid-cols-4">
        <CountCard icon={FileText} label="Tasks" value={tasks.length} />
        <CountCard icon={CalendarDays} label="Appointments" value={appointments.length} />
        <CountCard icon={ReceiptText} label="Estimates" value={estimates.length} />
        <CountCard icon={DollarSign} label="Invoices" value={invoices.length} />
      </section>

      <section className="grid gap-5 border-t border-white/10 p-5 lg:grid-cols-2">
        <MiniList
          title="Appointments"
          empty="No appointments yet."
          items={appointments.map((item) => ({
            id: item.id,
            title: item.title,
            meta: `${formatDate(item.startAt)} · ${item.status}`,
          }))}
        />

        <MiniList
          title="Tasks"
          empty="No tasks yet."
          items={tasks.map((task) => ({
            id: task.id,
            title: task.title,
            meta: `${task.priority} · ${task.status}`,
          }))}
        />

        <MiniList
          title="Estimates"
          empty="No estimates yet."
          items={estimates.map((estimate) => ({
            id: estimate.id,
            title: estimate.title,
            meta: `$${estimate.total.toLocaleString()} · ${estimate.status}`,
          }))}
        />

        <MiniList
          title="Invoices"
          empty="No invoices yet."
          items={invoices.map((invoice) => ({
            id: invoice.id,
            title: invoice.title,
            meta: `$${invoice.total.toLocaleString()} · ${invoice.status}`,
          }))}
        />
      </section>
    </BusinessOSCard>
  );
}

function ContactPill({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Phone;
  label: string;
  href?: string;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white";

  if (href) {
    return (
      <a href={href} className={className}>
        <Icon className="h-4 w-4 text-cyan-300" />
        {label}
      </a>
    );
  }

  return (
    <span className={className}>
      <Icon className="h-4 w-4 text-cyan-300" />
      {label}
    </span>
  );
}

function MoneyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-4">
      <p className="text-2xl font-black text-cyan-200">
        ${Math.round(value).toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
      <Icon className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function MiniList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string }>;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
      <h3 className="text-lg font-black">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/5 p-4">
              <p className="font-black text-white">{item.title}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                {item.meta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}