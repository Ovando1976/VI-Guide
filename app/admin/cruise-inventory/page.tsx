import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  DatabaseZap,
  KeyRound,
  Link2,
  ShieldCheck,
  ShipWheel,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { getSession } from "@/lib/auth-server";
import {
  getCruiseInventoryReadiness,
  providerName,
} from "@/lib/cruise-inventory/readiness";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cruise Inventory Readiness | USVI Explorer",
  description:
    "Track commercial credentials, provider integration, certification, and production readiness for live cruise inventory.",
};

export default async function CruiseInventoryReadinessPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/cruise-inventory");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  const readiness = getCruiseInventoryReadiness();
  const configured = new Set(readiness.configuredRequirements);
  const milestones = [
    {
      title: "Provider selected",
      description:
        "Choose Traveltek or Revelex and establish the commercial owner for the integration.",
      complete: readiness.provider === "traveltek" || readiness.provider === "revelex",
      icon: Link2,
    },
    {
      title: "Commercial agreement",
      description:
        "Approve platform pricing, implementation scope, support, data use, cancellation, and payment responsibilities.",
      complete: configured.has("Commercial contract approved"),
      icon: ShieldCheck,
    },
    {
      title: "Agency and supplier credentials",
      description:
        "Connect the host-agency or USVI Explorer supplier identifiers required by participating cruise lines.",
      complete: configured.has("Sandbox credentials configured"),
      icon: KeyRound,
    },
    {
      title: "Adapter and sandbox validation",
      description:
        "Map supplier search, cabins, fares, quotes, holds, bookings, amendments, and cancellations into USVI Explorer contracts.",
      complete: configured.has("Provider adapter explicitly enabled"),
      icon: DatabaseZap,
    },
    {
      title: "Production certification",
      description:
        "Complete supplier certification with controlled booking, payment, retrieval, cancellation, and reconciliation evidence.",
      complete: configured.has("Production certification approved"),
      icon: ShipWheel,
    },
  ];

  return (
    <AdminShell
      eyebrow="Cruise Commerce"
      title="Live inventory readiness"
      description="This control plane keeps USVI Explorer from presenting cached, synthetic, or unapproved cruise data as live supplier inventory."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <StatusCard
          label="Selected provider"
          value={providerName(readiness.provider)}
          detail={`Environment: ${readiness.environment}`}
        />
        <StatusCard
          label="Integration stage"
          value={humanize(readiness.stage)}
          detail={readiness.enabled ? "Provider calls enabled" : "Provider calls fail closed"}
        />
        <StatusCard
          label="Production inventory"
          value={readiness.live ? "Live" : "Not live"}
          detail={
            readiness.live
              ? "Supplier-verified inventory is available."
              : "No customer-facing live inventory claims are permitted."
          }
        />
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          {readiness.live ? (
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-600" />
          )}
          <div>
            <h2 className="text-2xl font-black tracking-[-.04em] text-[#043331]">
              {readiness.nextAction}
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-500">
              Cruise search prices are provisional. A supplier reprice must occur
              before any hold or booking, and a reservation is not confirmed until
              the supplier returns a valid confirmation number.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">
            Production milestones
          </p>
          <div className="mt-5 space-y-3">
            {milestones.map(({ title, description, complete, icon: Icon }) => (
              <div
                key={title}
                className="flex gap-4 rounded-[22px] border border-slate-200 p-4"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    complete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <h3 className="text-sm font-black text-[#043331]">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Checklist
            title="Configured"
            empty="No commercial or provider requirements are configured yet."
            items={readiness.configuredRequirements}
            complete
          />
          <Checklist
            title="Still required"
            empty="No remaining blockers are reported."
            items={readiness.missingRequirements}
            complete={false}
          />
        </div>
      </section>
    </AdminShell>
  );
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function Checklist({
  title,
  empty,
  items,
  complete,
}: {
  title: string;
  empty: string;
  items: string[];
  complete: boolean;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-600">
              {complete ? (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
              )}
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
          {empty}
        </p>
      )}
    </div>
  );
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
