"use client";

import {
  AlertTriangle,
  Building2,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { useState, type FormEvent } from "react";

type MerchantAccount = {
  uid: string;
  email: string;
  displayName: string | null;
  disabled: boolean;
  role: string;
  listingIds: string[];
  editable: boolean;
  lastSignInAt: string | null;
};

export function MerchantAccessBoard() {
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState<MerchantAccount | null>(null);
  const [listingText, setListingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadAccount(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/merchant-access?email=${encodeURIComponent(normalizedEmail)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as
        | { account?: MerchantAccount; error?: string }
        | null;
      if (!response.ok || !payload?.account) {
        throw new Error(payload?.error || "Unable to load this account.");
      }
      setAccount(payload.account);
      setListingText(payload.account.listingIds.join("\n"));
    } catch (caught) {
      setAccount(null);
      setListingText("");
      setError(
        caught instanceof Error ? caught.message : "Unable to load this account.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateAccess(enabled: boolean) {
    if (!account) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const listingIds = parseListingIds(listingText);
      const response = await fetch("/api/admin/merchant-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          enabled,
          listingIds,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { account?: MerchantAccount; message?: string; error?: string }
        | null;
      if (!response.ok || !payload?.account) {
        throw new Error(payload?.error || "Unable to update merchant access.");
      }
      setAccount(payload.account);
      setListingText(payload.account.listingIds.join("\n"));
      setMessage(payload.message || "Merchant access updated.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update merchant access.",
      );
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setEmail("");
    setAccount(null);
    setListingText("");
    setError(null);
    setMessage(null);
  }

  const listingIds = parseListingIds(listingText);

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Access administration
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Merchant Access
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/65">
                Assign existing Firebase accounts to the exact USVI Explorer listings
                they are authorized to operate. Every change invalidates old
                sessions and writes an audit record.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-xs font-bold text-white/75">
              Admin-only · listing scoped
            </div>
          </div>
        </section>

        <form
          onSubmit={loadAccount}
          className="mt-6 grid gap-3 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto_auto]"
        >
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Firebase account email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
              placeholder="merchant@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Load account
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-[9px] font-black uppercase tracking-[.14em] text-slate-600"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        {account ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                  <UserRoundCog className="h-6 w-6" />
                </div>
                <span
                  className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] ${
                    account.role === "merchant"
                      ? "bg-emerald-100 text-emerald-800"
                      : account.editable
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {account.role}
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-.03em]">
                {account.displayName || "Firebase user"}
              </h2>
              <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                {account.email}
              </p>

              <dl className="mt-6 space-y-3 text-sm">
                <AccountDetail label="User ID" value={account.uid} />
                <AccountDetail
                  label="Last sign-in"
                  value={formatDate(account.lastSignInAt)}
                />
                <AccountDetail
                  label="Account status"
                  value={account.disabled ? "Disabled" : "Active"}
                />
                <AccountDetail
                  label="Managed listings"
                  value={String(account.listingIds.length)}
                />
              </dl>

              {!account.editable ? (
                <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  Driver, dispatcher, and admin roles cannot be changed from
                  this merchant-only tool.
                </div>
              ) : null}
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f8f4ea] text-teal-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Authorized listings</h2>
                  <p className="text-xs font-semibold text-slate-500">
                    One listing ID per line, or separate IDs with commas.
                  </p>
                </div>
              </div>

              <textarea
                rows={10}
                value={listingText}
                disabled={!account.editable || saving}
                onChange={(event) => setListingText(event.target.value)}
                className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
                placeholder={"hotel-example\ntour-example\nrestaurant-example"}
              />

              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-xs font-bold text-teal-900">
                <ShieldCheck className="h-4 w-4" />
                {listingIds.length} unique listing
                {listingIds.length === 1 ? "" : "s"} ready to assign
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!account.editable || saving || !listingIds.length}
                  onClick={() => void updateAccess(true)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save merchant access
                </button>
                <button
                  type="button"
                  disabled={
                    !account.editable || saving || account.role !== "merchant"
                  }
                  onClick={() => void updateAccess(false)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-red-700 disabled:opacity-50"
                >
                  Revoke merchant access
                </button>
              </div>

              <p className="mt-5 text-xs font-semibold leading-5 text-slate-500">
                The account must already exist in Firebase Authentication. After
                access is granted or changed, the merchant must sign in again to
                receive the new listing scope.
              </p>
            </section>
          </div>
        ) : (
          <section className="mt-6 rounded-[30px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <UserRoundCog className="mx-auto h-10 w-10 text-teal-700" />
            <h2 className="mt-4 text-2xl font-black">Load a merchant account</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
              Search by the exact email used to create the Firebase account,
              then assign only the business listings that person is authorized
              to manage.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8f4ea] p-4">
      <dt className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-all font-bold text-[#043331]">{value}</dd>
    </div>
  );
}

function parseListingIds(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.replace(/\s+/g, " ").trim().slice(0, 160))
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

function formatDate(value: string | null) {
  if (!value) return "No sign-in recorded";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(timestamp);
}
