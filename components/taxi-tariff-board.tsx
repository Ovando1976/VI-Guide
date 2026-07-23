"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Power,
  ShieldCheck,
} from "lucide-react";

import type { OfficialTaxiTariff } from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

const FIELD =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100";

const EXAMPLE_RULES = `[
  {
    "id": "route-001",
    "originNames": ["Origin estate name"],
    "destinationNames": ["Destination estate name"],
    "onePassengerFare": 0,
    "additionalPassengerFare": 0,
    "luggageIncluded": 0,
    "luggageFarePerPiece": 0,
    "notes": "Enter only values verified against the official tariff."
  }
]`;

type GovernanceAction = {
  tariffId: string;
  type: "activate" | "retire";
};

export function TaxiTariffBoard() {
  const [tariffs, setTariffs] = useState<OfficialTaxiTariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<GovernanceAction | null>(
    null,
  );

  const loadTariffs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/admin/taxi-tariffs", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load taxi tariffs.");
      }
      setTariffs(Array.isArray(payload?.tariffs) ? payload.tariffs : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load taxi tariffs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTariffs();
  }, [loadTariffs]);

  const metrics = useMemo(() => {
    const verifiedActive = tariffs.filter(
      (tariff) =>
        tariff.status === "active" && tariff.activationStatus === "verified",
    ).length;
    const drafts = tariffs.filter((tariff) => tariff.status === "draft").length;
    const retired = tariffs.filter(
      (tariff) => tariff.status === "retired",
    ).length;
    const duplicateActiveIslands = (["stt", "stj", "stx"] as IslandCode[])
      .filter(
        (island) =>
          tariffs.filter(
            (tariff) => tariff.island === island && tariff.status === "active",
          ).length > 1,
      )
      .map(islandLabel);
    return { verifiedActive, drafts, retired, duplicateActiveIslands };
  }, [tariffs]);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    try {
      const rulesText = String(form.get("rules") ?? "");
      let rules: unknown;
      try {
        rules = JSON.parse(rulesText);
      } catch {
        throw new Error("Route rules must be valid JSON.");
      }

      const response = await fetch("/api/admin/taxi-tariffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          version: form.get("version"),
          island: form.get("island"),
          effectiveAt: form.get("effectiveAt"),
          sourceUrl: form.get("sourceUrl"),
          reviewReference: form.get("reviewReference"),
          rules,
          attested: form.get("attested") === "on",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create tariff draft.");
      }

      event.currentTarget.reset();
      setMessage(
        `Draft ${payload.tariffId} created. It cannot quote fares until separately activated.`,
      );
      await loadTariffs();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create tariff draft.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function applyGovernanceAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingAction) return;

    setSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `/api/admin/taxi-tariffs/${encodeURIComponent(pendingAction.tariffId)}/${pendingAction.type}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attested: form.get("attested") === "on",
            reviewReference: form.get("reviewReference"),
            ...(pendingAction.type === "retire"
              ? { reason: form.get("reason") }
              : {}),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Tariff governance action failed.");
      }

      setMessage(
        pendingAction.type === "activate"
          ? `Tariff ${pendingAction.tariffId} is now the verified active tariff. ${payload.retiredTariffIds?.length ?? 0} competing tariff(s) were retired.`
          : `Tariff ${pendingAction.tariffId} was retired. Quoting will fail closed if no other verified tariff is active.`,
      );
      setPendingAction(null);
      await loadTariffs();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Tariff governance action failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTariff = pendingAction
    ? tariffs.find((tariff) => tariff.id === pendingAction.tariffId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#032d2b,#075e58)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.18)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#f7d778]">
                Controlled mobility pilot
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
                Official tariff governance
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                Import reviewed Commission source data, preserve an audit trail,
                and activate exactly one verified tariff per island. Customer
                quotes fail closed for drafts, legacy manual activations,
                future-effective records, or duplicate active versions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/taxi-operations"
                className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
              >
                Taxi operations
              </Link>
              <Link
                href="/admin"
                className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00]"
              >
                Driver roster
              </Link>
            </div>
          </div>
        </section>

        {metrics.duplicateActiveIslands.length ? (
          <section className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-rose-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-black">Duplicate active tariffs detected</div>
              <p className="mt-1 text-sm font-semibold">
                {metrics.duplicateActiveIslands.join(", ")} currently has more
                than one active record. Activate the reviewed correct version;
                the transaction will retire competing versions.
              </p>
            </div>
          </section>
        ) : null}

        {message ? (
          <section className="flex items-start gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
          </section>
        ) : null}
        {errorMessage ? (
          <section className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-rose-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Verified active"
            value={metrics.verifiedActive}
            note="eligible to quote"
          />
          <Metric label="Drafts" value={metrics.drafts} note="cannot quote" />
          <Metric
            label="Retired"
            value={metrics.retired}
            note="preserved for audit"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                  Tariff register
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
                  Reviewed versions
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void loadTariffs()}
                disabled={loading}
                className="rounded-full border border-slate-200 px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="grid min-h-56 place-items-center">
                <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
              </div>
            ) : tariffs.length ? (
              <div className="mt-5 space-y-4">
                {tariffs.map((tariff) => (
                  <TariffCard
                    key={tariff.id}
                    tariff={tariff}
                    onAction={(type) =>
                      setPendingAction({ tariffId: tariff.id, type })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] bg-[#f8f4ea] p-6 text-sm font-semibold text-slate-600">
                No tariff versions have been imported through the reviewed
                workflow.
              </div>
            )}
          </section>

          <div className="space-y-6">
            {pendingAction && selectedTariff ? (
              <GovernanceActionForm
                action={pendingAction}
                tariff={selectedTariff}
                submitting={submitting}
                onCancel={() => setPendingAction(null)}
                onSubmit={applyGovernanceAction}
              />
            ) : null}

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-700">
                Source-controlled import
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
                Create tariff draft
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Draft creation never enables quoting. A second reviewed
                activation action is required.
              </p>

              <form onSubmit={createDraft} className="mt-6 space-y-4">
                <Field label="Tariff title" name="title" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Version" name="version" />
                  <label className="block">
                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
                      Island
                    </span>
                    <select name="island" required className={FIELD}>
                      <option value="">Choose island</option>
                      <option value="stt">St. Thomas</option>
                      <option value="stj">St. John</option>
                      <option value="stx">St. Croix</option>
                    </select>
                  </label>
                </div>
                <Field
                  label="Effective date"
                  name="effectiveAt"
                  type="date"
                />
                <Field
                  label="Official source URL"
                  name="sourceUrl"
                  type="url"
                />
                <Field
                  label="Source review reference"
                  name="reviewReference"
                  placeholder="Commission publication, case, or internal review ID"
                />
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
                    Route rules JSON
                  </span>
                  <textarea
                    name="rules"
                    required
                    rows={14}
                    defaultValue={EXAMPLE_RULES}
                    spellCheck={false}
                    className={`${FIELD} font-mono text-xs leading-5`}
                  />
                </label>
                <label className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
                  <input
                    type="checkbox"
                    name="attested"
                    required
                    className="mt-0.5 h-4 w-4 accent-[#0f766e]"
                  />
                  <span>
                    I attest that the title, effective date, source URL, route
                    endpoints, passenger charges, and luggage charges were
                    reviewed against the identified official Commission source.
                  </span>
                </label>
                <button
                  disabled={submitting}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-4 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="h-4 w-4" />
                  )}
                  Create reviewed draft
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function TariffCard({
  tariff,
  onAction,
}: {
  tariff: OfficialTaxiTariff;
  onAction: (type: GovernanceAction["type"]) => void;
}) {
  const verified =
    tariff.status === "active" && tariff.activationStatus === "verified";
  return (
    <article className="rounded-[26px] border border-slate-200 bg-[#fbfaf7] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tariff.status} verified={verified} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-600">
              {islandLabel(tariff.island)}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-[#043331]">
            {tariff.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Version {tariff.version} · effective {formatDate(tariff.effectiveAt)}
            · {tariff.rules.length} rule{tariff.rules.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tariff.status !== "active" || !verified ? (
            <button
              type="button"
              onClick={() => onAction("activate")}
              className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              <ShieldCheck className="h-4 w-4" /> Activate
            </button>
          ) : null}
          {tariff.status !== "retired" ? (
            <button
              type="button"
              onClick={() => onAction("retire")}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] text-rose-800"
            >
              <Power className="h-4 w-4" /> Retire
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-[20px] bg-white p-4 text-xs font-semibold text-slate-600 sm:grid-cols-2">
        <div>
          <span className="font-black text-[#043331]">Source review:</span>{" "}
          {tariff.reviewReference || "Legacy or missing"}
        </div>
        <div>
          <span className="font-black text-[#043331]">Activation:</span>{" "}
          {verified
            ? tariff.activationReviewReference || "Verified"
            : "Not governance verified"}
        </div>
      </div>
      <a
        href={tariff.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block break-all text-xs font-black text-teal-800 underline underline-offset-4"
      >
        Open official source
      </a>
    </article>
  );
}

function GovernanceActionForm({
  action,
  tariff,
  submitting,
  onCancel,
  onSubmit,
}: {
  action: GovernanceAction;
  tariff: OfficialTaxiTariff;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const activating = action.type === "activate";
  return (
    <section
      className={`rounded-[30px] border p-5 shadow-sm sm:p-6 ${
        activating
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-600">
        Reviewed governance action
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
        {activating ? "Activate" : "Retire"} {tariff.version}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {activating
          ? `This will make this the only active tariff for ${islandLabel(tariff.island)} and atomically retire competing active versions.`
          : "This immediately removes the tariff from customer quoting. If no verified tariff remains, the app will require dispatch review."}
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field
          label={`${activating ? "Activation" : "Retirement"} review reference`}
          name="reviewReference"
        />
        {!activating ? (
          <Field label="Retirement reason" name="reason" />
        ) : null}
        <label className="flex items-start gap-3 rounded-[20px] border border-white/70 bg-white/70 p-4 text-xs font-semibold leading-5">
          <input
            type="checkbox"
            name="attested"
            required
            className="mt-0.5 h-4 w-4 accent-[#0f766e]"
          />
          <span>
            I reviewed this action and understand its effect on regulated fare
            quoting for {islandLabel(tariff.island)}.
          </span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[.14em]"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50 ${
              activating ? "bg-emerald-800" : "bg-rose-800"
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : activating ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Confirm {action.type}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className={FIELD}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-400">{note}</div>
    </div>
  );
}

function StatusBadge({
  status,
  verified,
}: {
  status: OfficialTaxiTariff["status"];
  verified: boolean;
}) {
  const label = verified ? "Verified active" : status;
  const classes = verified
    ? "bg-emerald-100 text-emerald-800"
    : status === "retired"
      ? "bg-slate-200 text-slate-700"
      : status === "active"
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.14em] ${classes}`}
    >
      {label}
    </span>
  );
}

function islandLabel(island: IslandCode) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}
