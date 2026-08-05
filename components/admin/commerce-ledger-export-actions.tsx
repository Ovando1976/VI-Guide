import { Download, FileSpreadsheet, Store } from "lucide-react";

export function CommerceLedgerExportActions() {
  return (
    <section className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-5 text-[#043331] sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-[26px] border border-emerald-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">
                Settlement statements
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                Export immutable accounting evidence
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            CSV exports include booking and Stripe references, allocation amounts,
            status, fee policy, and statement totals. Traveler contact information
            is never included.
          </p>
        </div>

        <a
          href="/api/admin/commerce-ledger/export"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
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
              maxLength={180}
              autoComplete="off"
              placeholder="Enter the exact assigned listing ID"
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 text-sm font-bold outline-none ring-emerald-200 transition focus:border-emerald-400 focus:ring-4"
            />
          </label>
          <button
            type="submit"
            className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-emerald-900"
          >
            <Download className="h-4 w-4" />
            Export merchant CSV
          </button>
        </form>
      </div>
    </section>
  );
}
