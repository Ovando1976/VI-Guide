"use client";

import {
  AlertTriangle,
  Archive,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Store,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatMerchantOfferMoney,
  merchantOfferToday,
  type MerchantOfferStatus,
} from "@/lib/merchant-offers";
import type { AppRole } from "@/lib/auth-server";

type OfferPublicState = "live" | "scheduled" | "expired" | "unavailable";

type MerchantOffer = {
  id: string;
  listingId: string;
  listingName: string;
  kind: "accommodation" | "tour" | "experience";
  island: "stt" | "stj" | "stx";
  title: string;
  summary: string;
  inclusions: string | null;
  terms: string | null;
  priceCents: number;
  compareAtCents: number | null;
  depositCents: number | null;
  validFrom: string;
  validThrough: string;
  status: MerchantOfferStatus;
  publicState: OfferPublicState;
  createdAt: string;
  updatedAt: string;
};

type OfferSummary = {
  total: number;
  draft: number;
  active: number;
  paused: number;
  archived: number;
  live: number;
  scheduled: number;
  expired: number;
};

type OfferFilter = "current" | MerchantOfferStatus | "all";

type OfferForm = {
  listingId: string;
  listingName: string;
  kind: MerchantOffer["kind"];
  island: MerchantOffer["island"];
  title: string;
  summary: string;
  inclusions: string;
  terms: string;
  price: string;
  compareAt: string;
  deposit: string;
  validFrom: string;
  validThrough: string;
};

const EMPTY_SUMMARY: OfferSummary = {
  total: 0,
  draft: 0,
  active: 0,
  paused: 0,
  archived: 0,
  live: 0,
  scheduled: 0,
  expired: 0,
};

export function MerchantOfferBoard({
  role,
  listingIds,
}: {
  role: AppRole;
  listingIds: string[];
}) {
  const today = merchantOfferToday();
  const [offers, setOffers] = useState<MerchantOffer[]>([]);
  const [summary, setSummary] = useState<OfferSummary>(EMPTY_SUMMARY);
  const [filter, setFilter] = useState<OfferFilter>("current");
  const [form, setForm] = useState<OfferForm>(() =>
    emptyForm(listingIds[0] ?? "", today),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = role === "merchant" || role === "admin";
  const hasListingScope = role === "admin" || listingIds.length > 0;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-offers", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            offers?: MerchantOffer[];
            summary?: OfferSummary;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load merchant offers.");
      }
      setOffers(Array.isArray(payload?.offers) ? payload.offers : []);
      setSummary(payload?.summary ?? EMPTY_SUMMARY);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load merchant offers.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const visibleOffers = useMemo(() => {
    if (filter === "all") return offers;
    if (filter === "current") {
      return offers.filter((offer) => offer.status !== "archived");
    }
    return offers.filter((offer) => offer.status === filter);
  }, [filter, offers]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm(listingIds[0] ?? "", today));
    setError(null);
    setMessage(null);
    setShowForm(true);
  }

  function startEdit(offer: MerchantOffer) {
    setEditingId(offer.id);
    setForm({
      listingId: offer.listingId,
      listingName: offer.listingName,
      kind: offer.kind,
      island: offer.island,
      title: offer.title,
      summary: offer.summary,
      inclusions: offer.inclusions ?? "",
      terms: offer.terms ?? "",
      price: centsToInput(offer.priceCents),
      compareAt: centsToInput(offer.compareAtCents),
      deposit: centsToInput(offer.depositCents),
      validFrom: offer.validFrom,
      validThrough: offer.validThrough,
    });
    setError(null);
    setMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm(listingIds[0] ?? "", today));
  }

  async function saveOffer() {
    if (!canManage || !hasListingScope) return;
    const priceCents = dollarsToCents(form.price);
    const compareAtCents = optionalDollarsToCents(form.compareAt);
    const depositCents = optionalDollarsToCents(form.deposit);
    if (priceCents === null || compareAtCents === false || depositCents === false) {
      setError("Use valid dollar amounts with no more than two decimal places.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const offer = {
        listingId: form.listingId,
        listingName: form.listingName,
        kind: form.kind,
        island: form.island,
        title: form.title,
        summary: form.summary,
        inclusions: form.inclusions,
        terms: form.terms,
        priceCents,
        compareAtCents,
        depositCents,
        validFrom: form.validFrom,
        validThrough: form.validThrough,
      };
      const response = await fetch("/api/merchant-offers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, offer } : offer,
        ),
      });
      const payload = (await response.json().catch(() => null)) as
        | { offer?: MerchantOffer; error?: string }
        | null;
      if (!response.ok || !payload?.offer) {
        throw new Error(payload?.error || "Unable to save the merchant offer.");
      }
      setMessage(
        editingId
          ? `${payload.offer.title} was updated.`
          : `${payload.offer.title} was saved as a draft.`,
      );
      closeFormAfterSave(listingIds, today, setEditingId, setForm, setShowForm);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save the merchant offer.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    offer: MerchantOffer,
    status: MerchantOfferStatus,
  ) {
    if (!canManage) return;
    setWorkingId(offer.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/merchant-offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offer.id, status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { offer?: MerchantOffer; error?: string }
        | null;
      if (!response.ok || !payload?.offer) {
        throw new Error(payload?.error || "Unable to update the offer status.");
      }
      setMessage(`${payload.offer.title} is now ${status}.`);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the offer status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="px-4 py-8 pb-32 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Sellable packages
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Turn a listing into an offer travelers can choose.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Build clear packages with verified prices, deposits, inclusions,
                and USVI selling dates. Publish only when the offer is ready.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric label="Live now" value={summary.live} />
              <HeroMetric
                label="Management"
                value={
                  role === "dispatcher"
                    ? "Read only"
                    : role === "merchant"
                      ? "Assigned listings"
                      : "Territory-wide"
                }
              />
            </div>
          </div>
        </section>

        {role === "merchant" && !listingIds.length ? (
          <section className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-900">
            <h2 className="text-xl font-black">No listing scope is assigned</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-rose-800/75">
              An administrator must assign at least one business listing before
              this account can create or publish offers.
            </p>
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Tag} label="Total" value={summary.total} />
          <Metric icon={CheckCircle2} label="Live" value={summary.live} />
          <Metric icon={Clock3} label="Scheduled" value={summary.scheduled} />
          <Metric icon={Edit3} label="Drafts" value={summary.draft} />
          <Metric icon={CirclePause} label="Paused" value={summary.paused} />
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["current", "Current"],
                  ["draft", "Draft"],
                  ["active", "Active"],
                  ["paused", "Paused"],
                  ["archived", "Archived"],
                  ["all", "All"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${
                    filter === value
                      ? "bg-[#043331] text-white"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void load()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Refresh
              </button>
              {canManage && hasListingScope ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
                >
                  <Plus className="h-4 w-4" /> New offer
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        <section className="mt-5 space-y-4">
          {loading && !offers.length ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleOffers.length ? (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <Store className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching offers yet</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-900/65">
                Create a draft package when the listing, price, and selling dates
                are ready.
              </p>
            </div>
          ) : (
            visibleOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                canManage={canManage}
                working={workingId === offer.id}
                onEdit={() => startEdit(offer)}
                onStatus={(status) => void changeStatus(offer, status)}
              />
            ))
          )}
        </section>
      </div>

      {showForm ? (
        <OfferEditor
          role={role}
          listingIds={listingIds}
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          today={today}
          onChange={setForm}
          onClose={closeForm}
          onSave={() => void saveOffer()}
        />
      ) : null}
    </main>
  );
}

function OfferEditor({
  role,
  listingIds,
  form,
  editing,
  saving,
  today,
  onChange,
  onClose,
  onSave,
}: {
  role: AppRole;
  listingIds: string[];
  form: OfferForm;
  editing: boolean;
  saving: boolean;
  today: string;
  onChange: (form: OfferForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  function patch(values: Partial<OfferForm>) {
    onChange({ ...form, ...values });
  }

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto bg-[#012321]/75 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[34px] bg-[#f8f4ea] p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              {editing ? "Edit package" : "New package"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              {editing ? "Update the paused or draft offer" : "Create a sellable offer draft"}
            </h2>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-50"
            aria-label="Close offer editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label="Listing">
            {role === "merchant" ? (
              <select
                value={form.listingId}
                disabled={editing}
                onChange={(event) => {
                  const listingId = event.target.value;
                  patch({
                    listingId,
                    listingName:
                      form.listingName || humanizeListingId(listingId),
                  });
                }}
                className={inputClass()}
              >
                <option value="">Choose listing</option>
                {listingIds.map((listingId) => (
                  <option key={listingId} value={listingId}>
                    {humanizeListingId(listingId)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.listingId}
                disabled={editing}
                onChange={(event) => patch({ listingId: event.target.value })}
                className={inputClass()}
                placeholder="canonical-listing-id"
              />
            )}
          </Field>
          <Field label="Public listing name">
            <input
              value={form.listingName}
              onChange={(event) => patch({ listingName: event.target.value })}
              className={inputClass()}
              maxLength={180}
              placeholder="Island Tour One"
            />
          </Field>
          <Field label="Offer type">
            <select
              value={form.kind}
              onChange={(event) =>
                patch({ kind: event.target.value as OfferForm["kind"] })
              }
              className={inputClass()}
            >
              <option value="tour">Tour</option>
              <option value="experience">Experience</option>
              <option value="accommodation">Accommodation</option>
            </select>
          </Field>
          <Field label="Island">
            <select
              value={form.island}
              onChange={(event) =>
                patch({ island: event.target.value as OfferForm["island"] })
              }
              className={inputClass()}
            >
              <option value="stt">St. Thomas</option>
              <option value="stj">St. John</option>
              <option value="stx">St. Croix</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Offer title">
              <input
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
                className={inputClass()}
                maxLength={120}
                placeholder="Sunset island tour"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Traveler-facing description">
              <textarea
                value={form.summary}
                onChange={(event) => patch({ summary: event.target.value })}
                className={inputClass("min-h-28 py-3")}
                maxLength={700}
                placeholder="Explain what makes this package worth booking."
              />
            </Field>
          </div>
          <Field label="Inclusions">
            <textarea
              value={form.inclusions}
              onChange={(event) => patch({ inclusions: event.target.value })}
              className={inputClass("min-h-28 py-3")}
              maxLength={1400}
              placeholder="Guide, pickup, refreshments..."
            />
          </Field>
          <Field label="Terms or restrictions">
            <textarea
              value={form.terms}
              onChange={(event) => patch({ terms: event.target.value })}
              className={inputClass("min-h-28 py-3")}
              maxLength={1400}
              placeholder="Advance reservation, minimum guests..."
            />
          </Field>
          <Field label="Offer price (USD)">
            <input
              inputMode="decimal"
              value={form.price}
              onChange={(event) => patch({ price: event.target.value })}
              className={inputClass()}
              placeholder="129.00"
            />
          </Field>
          <Field label="Original price (optional)">
            <input
              inputMode="decimal"
              value={form.compareAt}
              onChange={(event) => patch({ compareAt: event.target.value })}
              className={inputClass()}
              placeholder="159.00"
            />
          </Field>
          <Field label="Deposit (optional)">
            <input
              inputMode="decimal"
              value={form.deposit}
              onChange={(event) => patch({ deposit: event.target.value })}
              className={inputClass()}
              placeholder="50.00"
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Selling starts">
            <input
              type="date"
              min={editing ? undefined : today}
              value={form.validFrom}
              onChange={(event) => patch({ validFrom: event.target.value })}
              className={inputClass()}
            />
          </Field>
          <Field label="Selling ends">
            <input
              type="date"
              min={form.validFrom || today}
              value={form.validThrough}
              onChange={(event) => patch({ validThrough: event.target.value })}
              className={inputClass()}
            />
          </Field>
        </div>

        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-11 rounded-full border border-slate-200 bg-white px-6 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {editing ? "Save changes" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  canManage,
  working,
  onEdit,
  onStatus,
}: {
  offer: MerchantOffer;
  canManage: boolean;
  working: boolean;
  onEdit: () => void;
  onStatus: (status: MerchantOfferStatus) => void;
}) {
  const editable = offer.status === "draft" || offer.status === "paused";

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={offer.status} />
            <PublicStateBadge state={offer.publicState} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
              {offer.kind}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">
            {offer.title}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {offer.listingName} · {humanizeIsland(offer.island)}
          </p>
          <p className="mt-2 break-all font-mono text-[10px] font-bold text-slate-400">
            {offer.listingId} · {offer.id}
          </p>
        </div>
        <div className="rounded-[24px] bg-[#043331] px-5 py-4 text-right text-white">
          {offer.compareAtCents ? (
            <p className="text-xs font-bold text-white/45 line-through">
              {formatMerchantOfferMoney(offer.compareAtCents)}
            </p>
          ) : null}
          <p className="text-3xl font-black tracking-[-.04em]">
            {formatMerchantOfferMoney(offer.priceCents)}
          </p>
          <p className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-[#f5c451]">
            {offer.depositCents
              ? `${formatMerchantOfferMoney(offer.depositCents)} deposit`
              : "No fixed deposit"}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
        {offer.summary}
      </p>

      <div className="mt-5 grid gap-3 text-xs font-bold text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Selling starts" value={formatDate(offer.validFrom)} />
        <Detail label="Selling ends" value={formatDate(offer.validThrough)} />
        <Detail label="Updated" value={formatTime(offer.updatedAt)} />
        <Detail label="Visibility" value={humanizeValue(offer.publicState)} />
      </div>

      {canManage && offer.status !== "archived" ? (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {editable ? (
            <button
              type="button"
              disabled={working}
              onClick={onEdit}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          ) : null}
          {offer.status === "draft" || offer.status === "paused" ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onStatus("active")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CirclePlay className="h-4 w-4" />
              )}
              {offer.status === "draft" ? "Publish" : "Resume"}
            </button>
          ) : null}
          {offer.status === "active" ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onStatus("paused")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-100 px-5 text-[9px] font-black uppercase tracking-[.13em] text-amber-900 disabled:opacity-50"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CirclePause className="h-4 w-4" />
              )}
              Pause
            </button>
          ) : null}
          <button
            type="button"
            disabled={working}
            onClick={() => onStatus("archived")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-700 px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
          >
            <Archive className="h-4 w-4" /> Archive
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <BadgeDollarSign className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-[-.03em]">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#043331]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: MerchantOfferStatus }) {
  const styles: Record<MerchantOfferStatus, string> = {
    draft: "bg-sky-100 text-sky-800",
    active: "bg-emerald-100 text-emerald-800",
    paused: "bg-amber-100 text-amber-800",
    archived: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PublicStateBadge({ state }: { state: OfferPublicState }) {
  const styles: Record<OfferPublicState, string> = {
    live: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-violet-100 text-violet-800",
    expired: "bg-rose-100 text-rose-800",
    unavailable: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[state]}`}
    >
      {humanizeValue(state)}
    </span>
  );
}

function emptyForm(listingId: string, today: string): OfferForm {
  return {
    listingId,
    listingName: listingId ? humanizeListingId(listingId) : "",
    kind: "tour",
    island: "stt",
    title: "",
    summary: "",
    inclusions: "",
    terms: "",
    price: "",
    compareAt: "",
    deposit: "",
    validFrom: today,
    validThrough: addDays(today, 30),
  };
}

function closeFormAfterSave(
  listingIds: string[],
  today: string,
  setEditingId: (value: string | null) => void,
  setForm: (value: OfferForm) => void,
  setShowForm: (value: boolean) => void,
) {
  setEditingId(null);
  setForm(emptyForm(listingIds[0] ?? "", today));
  setShowForm(false);
}

function dollarsToCents(value: string) {
  const match = value.trim().match(/^(\d{1,5})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) ? cents : null;
}

function optionalDollarsToCents(value: string): number | null | false {
  if (!value.trim()) return null;
  return dollarsToCents(value) ?? false;
}

function centsToInput(value: number | null) {
  if (value === null) return "";
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2);
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function humanizeListingId(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeIsland(value: MerchantOffer["island"]) {
  return value === "stt" ? "St. Thomas" : value === "stj" ? "St. John" : "St. Croix";
}

function humanizeValue(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/St_Thomas",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}

function inputClass(extra = "") {
  return `min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600 disabled:bg-slate-100 ${extra}`;
}
