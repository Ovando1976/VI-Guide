"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FileCheck2, Loader2 } from "lucide-react";

import type { OfficialTaxiTariff } from "@/types/taxi-operations";

const FIELD =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100";

export function TaxiTariffPromotionPanel() {
  const [tariffs, setTariffs] = useState<OfficialTaxiTariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadTariffs();
  }, []);

  async function loadTariffs() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/taxi-tariffs", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load taxi tariffs.");
      }
      setTariffs(Array.isArray(payload?.tariffs) ? payload.tariffs : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load taxi tariffs.");
    } finally {
      setLoading(false);
    }
  }

  const legacyTariffs = useMemo(
    () =>
      tariffs.filter(
        (tariff) =>
          !tariff.reviewReference &&
          Array.isArray(tariff.rules) &&
          tariff.rules.length > 0 &&
          Boolean(tariff.sourceUrl),
      ),
    [tariffs],
  );

  async function promote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const tariffId = String(form.get("tariffId") ?? "").trim();

    setSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `/api/admin/taxi-tariffs/${encodeURIComponent(tariffId)}/promote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: form.get("version"),
            reviewReference: form.get("reviewReference"),
            attested: form.get("attested") === "on",
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to promote legacy tariff.");
      }

      setMessage(
        `Reviewed draft ${payload.tariffId} created with ${payload.ruleCount} preserved rules. It remains non-quoteable until separately activated.`,
      );
      formElement.reset();
      await loadTariffs();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to promote legacy tariff.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-[30px] border border-teal-200 bg-teal-50 p-5 text-[#043331] shadow-sm sm:p-6">
      <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
        Safe migration path
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
        Promote legacy transcription to reviewed draft
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Copies the existing route rules exactly into a new governed draft. It does not
        activate quoting, mutate the legacy record, or bypass source-review attestation.
      </p>

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-900">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm font-semibold text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading legacy tariffs…
        </div>
      ) : legacyTariffs.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">
          No source-backed legacy tariff is eligible for promotion.
        </div>
      ) : (
        <form onSubmit={promote} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
              Legacy tariff
            </span>
            <select name="tariffId" required className={FIELD}>
              <option value="">Choose legacy transcription</option>
              {legacyTariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {islandLabel(tariff.island)} · {tariff.title} · {tariff.rules.length} rules · {tariff.version}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
              New reviewed version
            </span>
            <input
              name="version"
              required
              placeholder="2022-10-24-reviewed-1"
              className={FIELD}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
              Source review reference
            </span>
            <input
              name="reviewReference"
              required
              placeholder="Commission publication / internal review ID"
              className={FIELD}
            />
          </label>

          <label className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950 lg:col-span-2">
            <input
              type="checkbox"
              name="attested"
              required
              className="mt-0.5 h-4 w-4 accent-[#0f766e]"
            />
            <span>
              I reviewed the selected legacy transcription against its identified official
              Commission source and attest that the copied route endpoints, passenger fares,
              luggage charges, effective date, and source URL are suitable for governed review.
            </span>
          </label>

          <button
            disabled={submitting}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-4 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-50 lg:col-span-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="h-4 w-4" />
            )}
            Create reviewed copy
          </button>
        </form>
      )}
    </section>
  );
}

function islandLabel(island: string) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return island;
}
