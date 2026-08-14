"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

type MerchantAccount = {
  uid: string;
  email: string;
  displayName: string | null;
  disabled: boolean;
  role: string;
  listingIds: string[];
  editable: boolean;
};

export function ApprovedPartnerOnboarding({
  applicationId,
  email,
  listingId,
  convertedAt,
}: {
  applicationId: string;
  email: string;
  listingId: string;
  convertedAt: string | null;
}) {
  const normalizedApplicationId = applicationId.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedListingId = listingId.trim();
  const [account, setAccount] = useState<MerchantAccount | null>(null);
  const [conversionRecorded, setConversionRecorded] = useState(
    Boolean(convertedAt),
  );
  const [loading, setLoading] = useState(Boolean(normalizedEmail));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedEmail) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/admin/merchant-access?email=${encodeURIComponent(
            normalizedEmail,
          )}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | { account?: MerchantAccount; error?: string }
          | null;
        if (!response.ok || !payload?.account) {
          throw new Error(
            payload?.error ||
              "This applicant does not yet have a USVI Explorer Firebase account.",
          );
        }
        if (!cancelled) setAccount(payload.account);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load the applicant account.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedEmail]);

  async function completeOnboarding() {
    if (!account || !normalizedListingId || !normalizedApplicationId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const listingIds = Array.from(
        new Set([...account.listingIds, normalizedListingId]),
      );
      const response = await fetch("/api/admin/merchant-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          enabled: true,
          listingIds,
          partnerApplicationId: normalizedApplicationId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            account?: MerchantAccount;
            partnerConversionRecorded?: boolean;
            message?: string;
            error?: string;
          }
        | null;
      if (!response.ok || !payload?.account) {
        throw new Error(payload?.error || "Unable to complete partner onboarding.");
      }
      setAccount(payload.account);
      setConversionRecorded(payload.partnerConversionRecorded === true);
      setMessage(
        payload.message ||
          `Merchant access and onboarding were recorded for ${normalizedListingId}.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to complete partner onboarding.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!normalizedEmail) return null;

  const alreadyAssigned = Boolean(
    account?.role === "merchant" &&
      normalizedListingId &&
      account.listingIds.includes(normalizedListingId),
  );
  const needsOnboardingAction = Boolean(
    account &&
      normalizedListingId &&
      normalizedApplicationId &&
      (!alreadyAssigned || !conversionRecorded),
  );

  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-700">
                Approved partner handoff
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-.03em]">
                {normalizedEmail}
              </h2>
              <p className="mt-1 text-sm font-semibold text-amber-950/65">
                {normalizedListingId
                  ? `Reviewed listing scope: ${normalizedListingId}`
                  : "No listing ID was supplied. Confirm the canonical listing before granting access."}
              </p>
            </div>
          </div>
          {loading ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] text-amber-800">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading account
            </span>
          ) : needsOnboardingAction ? (
            <button
              type="button"
              disabled={saving || account?.disabled || !account?.editable}
              onClick={() => void completeOnboarding()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {alreadyAssigned ? "Record onboarding" : "Grant listing access"}
            </button>
          ) : null}
        </div>

        {account ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Detail
              icon={Search}
              label="Firebase account"
              value={account.displayName || account.email}
            />
            <Detail icon={Building2} label="Current role" value={account.role} />
            <Detail
              icon={ShieldCheck}
              label="Managed listings"
              value={String(account.listingIds.length)}
            />
          </div>
        ) : null}

        {alreadyAssigned && conversionRecorded ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Merchant access is active and the partner conversion is recorded.
          </div>
        ) : alreadyAssigned ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> This account already manages the listing, but the approved application still needs its onboarding completion recorded.
          </div>
        ) : null}
        {message ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white px-4 py-3">
      <Icon className="h-4 w-4 text-amber-700" />
      <p className="mt-2 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}
