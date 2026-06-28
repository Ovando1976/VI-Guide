import { useMemo, useState } from "react";
import { Calculator, FileText, Loader2, Plus } from "lucide-react";

import {
  createBusinessEstimate,
  updateBusinessEstimateStatus,
  type BusinessEstimate,
  type MoneyStatus,
} from "../money";
import { createBusinessTimelineEvent } from "../firestore";
import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type Props = {
  data: BusinessOSData;
  onRefresh?: () => void;
};

export default function EstimateBuilder({ data, onRefresh }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultBusinessId = data.businesses[0]?.id ?? "";

  const estimates = useMemo(
    () =>
      data.estimates
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10),
    [data.estimates],
  );

  async function createEstimate() {
    const amount = Number(price);

    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotice("Add a title and valid amount.");
      return;
    }

    if (!defaultBusinessId) {
      setNotice("Create or claim a business listing before creating estimates.");
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const estimateId = await createBusinessEstimate({
        businessId: defaultBusinessId,
        title: title.trim(),
        notes: description.trim(),
        lineItems: [
          {
            description: description.trim() || title.trim(),
            quantity: 1,
            unitPrice: amount,
          },
        ],
      });

      await createBusinessTimelineEvent({
        businessId: defaultBusinessId,
        type: "estimate",
        title: "Estimate created",
        description: `${title.trim()} — $${amount.toLocaleString()}`,
        source: "Business OS Money",
      });

      setTitle("");
      setDescription("");
      setPrice("");
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create estimate:", error);
      setNotice("Estimate could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(estimate: BusinessEstimate, status: MoneyStatus) {
    setUpdatingId(estimate.id);
    setNotice(null);

    try {
      await updateBusinessEstimateStatus(estimate.id, status);

      await createBusinessTimelineEvent({
        businessId: estimate.businessId,
        leadId: estimate.leadId,
        type: "estimate",
        title: `Estimate marked ${status}`,
        description: `${estimate.title} — $${estimate.total.toLocaleString()}`,
        source: "Business OS Money",
      });

      onRefresh?.();
    } catch (error) {
      console.error("Failed to update estimate:", error);
      setNotice("Estimate status could not be updated.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Estimate Builder"
        text="Create quick customer estimates and move them through your sales pipeline."
        icon={Calculator}
      />

      <div className="border-b border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.5fr_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Estimate title..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description..."
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
            onClick={() => void createEstimate()}
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

      {estimates.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No estimates yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Customer estimates will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {estimates.map((estimate) => (
            <div key={estimate.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">{estimate.title}</h3>
                  <StatusBadge status={estimate.status} />
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                    {formatDate(estimate.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/60">
                  {estimate.notes || "No notes."}
                </p>

                <p className="mt-3 text-3xl font-black text-cyan-200">
                  ${estimate.total.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <StatusButton
                  label="Sent"
                  active={estimate.status === "sent"}
                  disabled={updatingId === estimate.id}
                  onClick={() => void changeStatus(estimate, "sent")}
                />
                <StatusButton
                  label="Accepted"
                  active={estimate.status === "accepted"}
                  disabled={updatingId === estimate.id}
                  onClick={() => void changeStatus(estimate, "accepted")}
                />
                <StatusButton
                  label="Declined"
                  active={estimate.status === "declined"}
                  disabled={updatingId === estimate.id}
                  onClick={() => void changeStatus(estimate, "declined")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </BusinessOSCard>
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