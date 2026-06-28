import { useMemo, useState } from "react";
import { Loader2, Mail, Phone, Search, UserPlus, UserRound } from "lucide-react";

import type { BusinessLead } from "../../../types/business";
import type { BusinessLeadStatus } from "../../../lib/firestore/businesses";
import { createBusinessTimelineEvent } from "../firestore";
import { createCustomerFromLead } from "../customers";
import type { BusinessOSData } from "../types";
import { formatDate, label } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type LeadFilter = "all" | BusinessLeadStatus;

export default function LeadCRM({
  data,
  updatingLeadId,
  onChangeLeadStatus,
  onRefresh,
}: {
  data: BusinessOSData;
  updatingLeadId: string | null;
  onChangeLeadStatus: (leadId: string, status: BusinessLeadStatus) => void;
  onRefresh?: () => void;
}) {
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [search, setSearch] = useState("");
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const existingCustomerLeadIds = useMemo(
    () => new Set(data.customers.map((customer) => customer.leadId).filter(Boolean)),
    [data.customers],
  );

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.leads.filter((lead) => {
      const status = (lead.status || "new") as BusinessLeadStatus;
      const business = data.businessById.get(lead.businessId);

      const matchesFilter = filter === "all" || status === filter;

      const matchesSearch =
        !term ||
        [
          lead.visitorName,
          lead.visitorEmail,
          lead.visitorPhone,
          lead.message,
          lead.source,
          business?.name,
          business?.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [data.businessById, data.leads, filter, search]);

  async function convertLeadToCustomer(lead: BusinessLead) {
    if (existingCustomerLeadIds.has(lead.id)) {
      setNotice("This lead is already connected to a customer profile.");
      return;
    }

    setConvertingLeadId(lead.id);
    setNotice(null);

    try {
      await createCustomerFromLead(lead);

      await createBusinessTimelineEvent({
        businessId: lead.businessId,
        leadId: lead.id,
        type: "lead",
        title: "Lead converted to customer",
        description: `${lead.visitorName} was added as a customer profile.`,
        source: "Business OS CRM",
      });

      onRefresh?.();
    } catch (error) {
      console.error("Failed to convert lead:", error);
      setNotice("Lead could not be converted to a customer.");
    } finally {
      setConvertingLeadId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Lead CRM"
        text="Filter, search, manage, and convert customer opportunities."
        icon={UserRound}
      />

      <div className="border-b border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, business, phone, email, source..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-12 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cyan-300"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterButton label="New" active={filter === "new"} onClick={() => setFilter("new")} />
            <FilterButton
              label="Contacted"
              active={filter === "contacted"}
              onClick={() => setFilter("contacted")}
            />
            <FilterButton label="Won" active={filter === "won"} onClick={() => setFilter("won")} />
            <FilterButton label="Lost" active={filter === "lost"} onClick={() => setFilter("lost")} />
          </div>
        </div>

        {notice ? (
          <p className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100">
            {notice}
          </p>
        ) : null}
      </div>

      {filteredLeads.length === 0 ? (
        <div className="p-8 text-center">
          <Mail className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No matching leads</h3>
          <p className="mt-2 text-sm text-white/60">
            New leads from Directory, Maps, Mobility, Concierge, and Tours will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {filteredLeads.map((lead) => {
            const business = data.businessById.get(lead.businessId);
            const status = (lead.status || "new") as BusinessLeadStatus;
            const converted = existingCustomerLeadIds.has(lead.id);
            const converting = convertingLeadId === lead.id;

            return (
              <div key={lead.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black">{lead.visitorName}</h3>
                    <StatusBadge status={status} />

                    {converted ? (
                      <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
                        Customer
                      </span>
                    ) : null}

                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase text-cyan-100">
                      {label(lead.source)}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-cyan-200">
                    {business?.name || "Unknown business"}
                  </p>

                  <p className="mt-3 rounded-2xl bg-slate-950/70 p-4 text-sm leading-relaxed text-white/75">
                    {lead.message}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {lead.visitorPhone ? (
                      <a
                        href={`tel:${lead.visitorPhone}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-white"
                      >
                        <Phone className="h-4 w-4 text-cyan-300" />
                        {lead.visitorPhone}
                      </a>
                    ) : null}

                    {lead.visitorEmail ? (
                      <a
                        href={`mailto:${lead.visitorEmail}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-white"
                      >
                        <Mail className="h-4 w-4 text-cyan-300" />
                        {lead.visitorEmail}
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 self-start sm:flex sm:flex-wrap lg:max-w-[25rem] lg:justify-end">
                  <button
                    type="button"
                    disabled={converted || converting}
                    onClick={() => void convertLeadToCustomer(lead)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-45"
                  >
                    {converting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {converted ? "Converted" : "Convert"}
                  </button>

                  {(["new", "contacted", "won", "lost"] as BusinessLeadStatus[]).map(
                    (nextStatus) => (
                      <StatusButton
                        key={nextStatus}
                        label={label(nextStatus)}
                        active={status === nextStatus}
                        disabled={updatingLeadId === lead.id}
                        onClick={() => onChangeLeadStatus(lead.id, nextStatus)}
                      />
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BusinessOSCard>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-3 text-xs font-black transition ${
        active ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: BusinessLeadStatus }) {
  const config = {
    new: "bg-cyan-300 text-slate-950",
    contacted: "bg-white text-slate-950",
    won: "bg-emerald-300 text-slate-950",
    lost: "bg-red-300 text-slate-950",
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${config}`}>
      {label(status)}
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
      className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-50 ${
        active ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}