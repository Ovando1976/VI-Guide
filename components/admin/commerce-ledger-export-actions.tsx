"use client";

import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";

export function CommerceLedgerExportActions() {
  const [validation, setValidation] = useState<{
    totalRecords: number;
    validatedRecords: number;
    rejectedRecordCount: number;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadValidation() {
      try {
        const response = await fetch("/api/admin/commerce-ledger", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ledgerValidation?: {
                totalRecords?: number;
                validatedRecords?: number;
                rejectedRecordCount?: number;
              };
              error?: string;
            }
          | null;
        if (!response.ok) {
          throw new Error(
            payload?.error || "Unable to verify the ledger before export.",
          );
        }
        if (!payload?.ledgerValidation) {
          throw new Error("The ledger validation result was incomplete.");
        }
        if (!active) return;
        setValidation({
          totalRecords: safeCount(payload.ledgerValidation.totalRecords),
          validatedRecords: safeCount(
            payload.ledgerValidation.validatedRecords,
          ),
          rejectedRecordCount: safeCount(
            payload.ledgerValidation.rejectedRecordCount,
          ),
        });
        setValidationError(null);
      } catch (caught) {
        if (!active) return;
        setValidation(null);
        setValidationError(
          caught instanceof Error
            ? caught.message
            : "Unable to verify the ledger before export.",
        );
      }
    }

    void loadValidation();
    return () => {
      active = false;
    };
  }, []);

  const exportBlocked = !validation || Boolean(validationError);

  return (
    <section className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-5 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {validationError ? (
          <div className="flex gap-3 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-black">Ledger validation is unavailable</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-amber-900/70">
                {validationError} Export controls are disabled until VI Guide can
                verify the accounting records.
              </p>
            </div>
          </div>
        ) : validation?.rejectedRecordCount ? (
          <div className="flex gap-3 rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
            <div>
              <p className="text-sm font-black">
                {validation.rejectedRecordCount} malformed ledger record
                {validation.rejectedRecordCount === 1 ? "" : "s"} excluded
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-rose-900/70">
                Dashboard balances and CSV totals include only the {validation.validatedRecords}
                {" "}validated records out of {validation.totalRecords}. Exported
                statements will be marked review required until every rejected
                record is corrected.
              </p>
            </div>
          </div>
        ) : validation ? (
          <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
            All {validation.validatedRecords} ledger records passed deterministic
            accounting validation.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            Validating ledger records before export…
          </div>
        )}

        <div className="grid gap-4 rounded-[26px] border border-emerald-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">
                  Accounting statements
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  Export complete ledger evidence
                </h2>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              CSV exports include the full selected ledger, booking and Stripe
              references, allocation amounts, fee policy, statement totals, and a
              rejected-record count. Traveler contact information is never included.
              These files are accounting evidence—not proof that a merchant payout
              or settlement occurred.
            </p>
          </div>

          <a
            href={exportBlocked ? undefined : "/api/admin/commerce-ledger/export"}
            aria-disabled={exportBlocked}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[.14em] ${
              exportBlocked
                ? "pointer-events-none bg-slate-200 text-slate-500"
                : "bg-[#043331] text-white"
            }`}
          >
            <Download className="h-4 w-4" />
            Export all CSV
          </a>

          <form
            action="/api/admin/commerce-ledger/export"
            method="get"
            className="grid gap-3 lg:col-span-2 sm:grid-cols-[1fr_auto]"
          >
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                <Store className="h-4 w-4" />
                Merchant listing ID
              </span>
              <input
                name="listingId"
                type="text"
                required
                disabled={exportBlocked}
                maxLength={180}
                autoComplete="off"
                placeholder="Enter the exact assigned listing ID"
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 text-sm font-bold outline-none ring-emerald-200 transition focus:border-emerald-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={exportBlocked}
              className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export merchant CSV
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function safeCount(value: unknown) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}
