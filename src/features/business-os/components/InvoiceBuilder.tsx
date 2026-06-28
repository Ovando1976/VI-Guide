import { useMemo, useState } from "react";
import { FileCheck2, FileText, Loader2, Plus } from "lucide-react";

import {
  createBusinessInvoice,
  createBusinessPayment,
  updateBusinessInvoiceStatus,
  type BusinessInvoice,
  type MoneyStatus,
} from "../money";
import { createBusinessTimelineEvent } from "../firestore";
import type { BusinessOSData } from "../types";
import { updateBusinessCustomerValue } from "../customers";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function InvoiceBuilder({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultBusinessId = data.businesses[0]?.id ?? "";

  const invoices = useMemo(
    () =>
      data.invoices
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10),
    [data.invoices],
  );

  async function createInvoice() {
    const amount = Number(price);

    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotice("Add a title and valid amount.");
      return;
    }

    if (!defaultBusinessId) {
      setNotice("Create or claim a business listing before creating invoices.");
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      await createBusinessInvoice({
        businessId: defaultBusinessId,
        title: title.trim(),
        notes: "Created from Business OS invoice builder.",
        lineItems: [
          {
            description: title.trim(),
            quantity: 1,
            unitPrice: amount,
          },
        ],
        dueAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      await createBusinessTimelineEvent({
        businessId: defaultBusinessId,
        type: "invoice",
        title: "Invoice created",
        description: `${title.trim()} — $${amount.toLocaleString()}`,
        source: "Business OS Money",
      });

      setTitle("");
      setPrice("");
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create invoice:", error);
      setNotice("Invoice could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(invoice: BusinessInvoice, status: MoneyStatus) {
    setUpdatingId(invoice.id);
    setNotice(null);

    try {
      await updateBusinessInvoiceStatus(invoice.id, status);

      if (status === "paid") {
        await createBusinessPayment({
          businessId: invoice.businessId,
          invoiceId: invoice.id,
          customerName: invoice.customerName,
          amount: invoice.balanceDue || invoice.total,
          method: "manual",
          status: "completed",
          notes: `Payment recorded for ${invoice.title}`,
        });
      }

      const matchingCustomer = data.customers.find((customer) => {
      if (invoice.leadId && customer.leadId === invoice.leadId) return true;
      if (invoice.customerName && customer.name === invoice.customerName) return true;
       return false;
      });

      if (matchingCustomer) {
         await updateBusinessCustomerValue(
           matchingCustomer.id,
           (matchingCustomer.lifetimeValue || 0) + (invoice.balanceDue || invoice.total),
       );
       }

      await createBusinessTimelineEvent({
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        type: status === "paid" ? "payment" : "invoice",
        title: status === "paid" ? "Invoice paid" : `Invoice marked ${status}`,
        description: `${invoice.title} — $${invoice.total.toLocaleString()}`,
        source: "Business OS Money",
      });

      onRefresh?.();
    } catch (error) {
      console.error("Failed to update invoice:", error);
      setNotice("Invoice status could not be updated.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Invoice Builder"
        text="Create invoices, mark them sent or paid, and record payments."
        icon={FileCheck2}
      />

      <div className="border-b border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.5fr_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Invoice title..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Amount"
            inputMode="decimal"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <button
            type="button"
            onClick={() => void createInvoice()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </div>

        {notice ? (
          <p className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100">
            {notice}
          </p>
        ) : null}
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No invoices yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Customer invoices and payments will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">{invoice.title}</h3>
                  <StatusBadge status={invoice.status} />
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                    {formatDate(invoice.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/60">
                  {invoice.notes || "No notes."}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <MoneyPill label="Total" value={invoice.total} />
                  <MoneyPill label="Paid" value={invoice.amountPaid} />
                  <MoneyPill label="Due" value={invoice.balanceDue} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <StatusButton
                  label="Sent"
                  active={invoice.status === "sent"}
                  disabled={updatingId === invoice.id}
                  onClick={() => void changeStatus(invoice, "sent")}
                />
                <StatusButton
                  label="Paid"
                  active={invoice.status === "paid"}
                  disabled={updatingId === invoice.id}
                  onClick={() => void changeStatus(invoice, "paid")}
                />
                <StatusButton
                  label="Void"
                  active={invoice.status === "void"}
                  disabled={updatingId === invoice.id}
                  onClick={() => void changeStatus(invoice, "void")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </BusinessOSCard>
  );
}

function MoneyPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-2xl bg-slate-950/70 px-4 py-3">
      <span className="block text-xs font-black uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <span className="block text-xl font-black text-cyan-200">
        ${value.toLocaleString()}
      </span>
    </span>
  );
}

function StatusBadge({ status }: { status: MoneyStatus }) {
  return (
    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase text-cyan-100">
      {status}
    </span>
  );
}

function StatusButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black disabled:opacity-50 ${
        active ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white"
      }`}
    >
      {label}
    </button>
  );
}