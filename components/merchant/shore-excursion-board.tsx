"use client";

import {
  Archive,
  CirclePause,
  CirclePlay,
  Clock3,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  ShipWheel,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Offer = {
  id: string;
  listingId: string;
  listingName: string;
  kind: "tour" | "experience";
  island: "stt" | "stj" | "stx";
  title: string;
  status: string;
  validFrom: string;
  validThrough: string;
};

type Status = "draft" | "active" | "paused" | "archived";
type Profile = {
  offerId: string;
  listingId: string;
  listingName: string;
  offerTitle: string;
  island: "stt" | "stj" | "stx";
  supportedPorts: string[];
  meetingPoint: string;
  durationMinutes: number;
  minReturnBufferMinutes: number;
  pickupIncluded: boolean;
  maxGuests: number;
  mobilityNotes: string | null;
  accessibilityNotes: string | null;
  status: Status;
  updatedAt: string;
};

type FormState = {
  offerId: string;
  supportedPorts: string[];
  meetingPoint: string;
  durationMinutes: string;
  minReturnBufferMinutes: string;
  pickupIncluded: boolean;
  maxGuests: string;
  mobilityNotes: string;
  accessibilityNotes: string;
};

const PORTS = [
  { id: "havensight", island: "stt", label: "Havensight / WICO" },
  { id: "crown_bay", island: "stt", label: "Crown Bay" },
  {
    id: "charlotte_amalie_anchorage",
    island: "stt",
    label: "Charlotte Amalie anchorage",
  },
  { id: "cruz_bay", island: "stj", label: "Cruz Bay tender / ferry area" },
  { id: "frederiksted", island: "stx", label: "Frederiksted Cruise Pier" },
  {
    id: "christiansted_tender",
    island: "stx",
    label: "Christiansted tender area",
  },
] as const;

export function ShoreExcursionBoard() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-shore-excursions", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            offers?: Offer[];
            profiles?: Profile[];
            canManage?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load shore excursion operations.");
      }
      setOffers(Array.isArray(payload?.offers) ? payload.offers : []);
      setProfiles(Array.isArray(payload?.profiles) ? payload.profiles : []);
      setCanManage(payload?.canManage === true);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load shore excursion operations.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const configuredIds = useMemo(
    () => new Set(profiles.map((profile) => profile.offerId)),
    [profiles],
  );
  const availableOffers = useMemo(
    () => offers.filter((offer) => !configuredIds.has(offer.id)),
    [configuredIds, offers],
  );
  const selectedOffer = offers.find((offer) => offer.id === form.offerId) ?? null;
  const selectedPorts = selectedOffer
    ? PORTS.filter((port) => port.island === selectedOffer.island)
    : [];

  function openCreate() {
    const offer = availableOffers[0] ?? null;
    setEditingId(null);
    setForm(emptyForm(offer?.id ?? "", offer?.island));
    setMessage(null);
    setError(null);
    setEditorOpen(true);
  }

  function openEdit(profile: Profile) {
    setEditingId(profile.offerId);
    setForm({
      offerId: profile.offerId,
      supportedPorts: profile.supportedPorts,
      meetingPoint: profile.meetingPoint,
      durationMinutes: String(profile.durationMinutes),
      minReturnBufferMinutes: String(profile.minReturnBufferMinutes),
      pickupIncluded: profile.pickupIncluded,
      maxGuests: String(profile.maxGuests),
      mobilityNotes: profile.mobilityNotes ?? "",
      accessibilityNotes: profile.accessibilityNotes ?? "",
    });
    setMessage(null);
    setError(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;
    resetEditor();
  }

  function resetEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyForm(""));
  }

  async function save() {
    if (!canManage) return;
    const payload = {
      offerId: form.offerId,
      supportedPorts: form.supportedPorts,
      meetingPoint: form.meetingPoint,
      durationMinutes: Number(form.durationMinutes),
      minReturnBufferMinutes: Number(form.minReturnBufferMinutes),
      pickupIncluded: form.pickupIncluded,
      maxGuests: Number(form.maxGuests),
      mobilityNotes: form.mobilityNotes,
      accessibilityNotes: form.accessibilityNotes,
    };

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/merchant-shore-excursions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { offerId: editingId, profile: payload }
            : payload,
        ),
      });
      const data = (await response.json().catch(() => null)) as
        | { profile?: Profile; error?: string }
        | null;
      if (!response.ok || !data?.profile) {
        throw new Error(data?.error || "Unable to save the shore excursion.");
      }
      setMessage(
        editingId
          ? `${data.profile.offerTitle} cruise operations were updated.`
          : `${data.profile.offerTitle} was saved as a shore excursion draft.`,
      );
      resetEditor();
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save the shore excursion.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(profile: Profile, status: Status) {
    setWorkingId(profile.offerId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/merchant-shore-excursions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: profile.offerId, status }),
      });
      const data = (await response.json().catch(() => null)) as
        | { profile?: Profile; error?: string }
        | null;
      if (!response.ok || !data?.profile) {
        throw new Error(data?.error || "Unable to update excursion status.");
      }
      setMessage(`${data.profile.offerTitle} is now ${status}.`);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update excursion status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="px-4 py-8 pb-32 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.32),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                <ShipWheel className="h-4 w-4" /> Shore excursion operations
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Turn a tour offer into a cruise-day product.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Add supported cruise ports, meeting instructions, group capacity,
                duration, and a conservative return-to-ship buffer. Travelers can
                only submit timing that clears that buffer.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric label="Configured" value={profiles.length} />
              <HeroMetric
                label="Live"
                value={profiles.filter((profile) => profile.status === "active").length}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <p className="text-sm font-black">Cruise-ready packages</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Start with an existing tour or experience offer, then add cruise operating rules.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </button>
            {canManage ? (
              <button
                type="button"
                disabled={!availableOffers.length}
                onClick={openCreate}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add excursion
              </button>
            ) : null}
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
          {loading && !profiles.length ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !profiles.length ? (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <ShipWheel className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No cruise-ready offers yet</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-900/65">
                Create a tour or experience in Offers first, then add its shore-excursion operating profile here.
              </p>
            </div>
          ) : (
            profiles.map((profile) => (
              <ProfileCard
                key={profile.offerId}
                profile={profile}
                canManage={canManage}
                working={workingId === profile.offerId}
                onEdit={() => openEdit(profile)}
                onStatus={(status) => void changeStatus(profile, status)}
              />
            ))
          )}
        </section>
      </div>

      {editorOpen ? (
        <Editor
          offers={editingId ? offers.filter((offer) => offer.id === editingId) : availableOffers}
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          selectedPorts={selectedPorts}
          onChange={setForm}
          onClose={closeEditor}
          onSave={() => void save()}
        />
      ) : null}
    </main>
  );
}

function Editor({
  offers,
  form,
  editing,
  saving,
  selectedPorts,
  onChange,
  onClose,
  onSave,
}: {
  offers: Offer[];
  form: FormState;
  editing: boolean;
  saving: boolean;
  selectedPorts: ReadonlyArray<(typeof PORTS)[number]>;
  onChange: (value: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const patch = (values: Partial<FormState>) => onChange({ ...form, ...values });

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto bg-[#012321]/75 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[34px] bg-[#f8f4ea] p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              {editing ? "Edit cruise operations" : "New shore excursion"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              Configure the ship-safe operating profile
            </h2>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-50"
            aria-label="Close shore excursion editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label="Linked tour / experience offer">
            <select
              value={form.offerId}
              disabled={editing}
              onChange={(event) => {
                const offerId = event.target.value;
                const offer = offers.find((item) => item.id === offerId) ?? null;
                onChange(emptyForm(offerId, offer?.island));
              }}
              className={inputClass()}
            >
              <option value="">Choose offer</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.title} · {offer.listingName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Maximum guests per request">
            <input
              type="number"
              min={1}
              max={100}
              value={form.maxGuests}
              onChange={(event) => patch({ maxGuests: event.target.value })}
              className={inputClass()}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Supported cruise ports">
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedPorts.map((port) => {
                  const checked = form.supportedPorts.includes(port.id);
                  return (
                    <label
                      key={port.id}
                      className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-sm font-bold normal-case tracking-normal ${
                        checked
                          ? "border-teal-400 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          patch({
                            supportedPorts: event.target.checked
                              ? [...form.supportedPorts, port.id]
                              : form.supportedPorts.filter((id) => id !== port.id),
                          });
                        }}
                      />
                      {port.label}
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>

          <Field label="Excursion duration (minutes)">
            <input
              type="number"
              min={30}
              max={720}
              step={15}
              value={form.durationMinutes}
              onChange={(event) => patch({ durationMinutes: event.target.value })}
              className={inputClass()}
            />
          </Field>
          <Field label="Minimum return-to-ship buffer (minutes)">
            <input
              type="number"
              min={60}
              max={300}
              step={15}
              value={form.minReturnBufferMinutes}
              onChange={(event) => patch({ minReturnBufferMinutes: event.target.value })}
              className={inputClass()}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Cruise guest meeting point">
              <input
                value={form.meetingPoint}
                onChange={(event) => patch({ meetingPoint: event.target.value })}
                maxLength={240}
                className={inputClass()}
                placeholder="Exact pickup desk, gate, landmark, or walking directions"
              />
            </Field>
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.pickupIncluded}
              onChange={(event) => patch({ pickupIncluded: event.target.checked })}
            />
            Port pickup is included
          </label>
          <div className="hidden sm:block" />

          <Field label="Pickup / transportation notes">
            <textarea
              value={form.mobilityNotes}
              onChange={(event) => patch({ mobilityNotes: event.target.value })}
              maxLength={1200}
              className={inputClass("min-h-28 py-3")}
              placeholder="Vehicle type, walking segment, pickup procedure, traffic constraints..."
            />
          </Field>
          <Field label="Accessibility notes">
            <textarea
              value={form.accessibilityNotes}
              onChange={(event) => patch({ accessibilityNotes: event.target.value })}
              maxLength={1200}
              className={inputClass("min-h-28 py-3")}
              placeholder="Mobility, wheelchair, stairs, terrain, child-seat, or assistance information..."
            />
          </Field>
        </div>

        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950/75">
          The return buffer is a minimum operating rule, not a guarantee that a ship
          will wait. Operators should use conservative durations and update or pause
          the excursion when traffic, weather, or port conditions materially change.
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Save changes" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  canManage,
  working,
  onEdit,
  onStatus,
}: {
  profile: Profile;
  canManage: boolean;
  working: boolean;
  onEdit: () => void;
  onStatus: (status: Status) => void;
}) {
  const editable = profile.status === "draft" || profile.status === "paused";
  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={profile.status} />
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-teal-800">
              {humanizeIsland(profile.island)}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">
            {profile.offerTitle}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{profile.listingName}</p>
        </div>
        <div className="rounded-[24px] bg-[#043331] px-5 py-4 text-white">
          <ShieldCheck className="h-5 w-5 text-[#f5c451]" />
          <p className="mt-3 text-2xl font-black">{profile.minReturnBufferMinutes} min</p>
          <p className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/45">
            Minimum ship buffer
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail icon={Clock3} label="Duration" value={`${profile.durationMinutes} min`} />
        <Detail icon={Users} label="Max guests" value={String(profile.maxGuests)} />
        <Detail
          icon={ShipWheel}
          label="Port pickup"
          value={profile.pickupIncluded ? "Included" : "Meet locally"}
        />
        <Detail
          icon={MapPin}
          label="Ports"
          value={profile.supportedPorts.length.toString()}
        />
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
        <strong className="text-[#043331]">Meeting point:</strong> {profile.meetingPoint}
      </div>

      {canManage && profile.status !== "archived" ? (
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
          {profile.status === "draft" || profile.status === "paused" ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onStatus("active")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <CirclePlay className="h-4 w-4" />}
              {profile.status === "draft" ? "Publish" : "Resume"}
            </button>
          ) : null}
          {profile.status === "active" ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onStatus("paused")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-100 px-5 text-[9px] font-black uppercase tracking-[.13em] text-amber-900 disabled:opacity-50"
            >
              <CirclePause className="h-4 w-4" /> Pause
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

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-4 w-4 text-teal-700" />
      <p className="mt-3 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <ShipWheel className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-[-.03em]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const style =
    status === "active"
      ? "bg-emerald-100 text-emerald-800"
      : status === "paused"
        ? "bg-amber-100 text-amber-800"
        : status === "archived"
          ? "bg-slate-200 text-slate-700"
          : "bg-sky-100 text-sky-800";
  return (
    <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${style}`}>
      {status}
    </span>
  );
}

function emptyForm(offerId: string, island?: Offer["island"]): FormState {
  const firstPort = island ? PORTS.find((port) => port.island === island)?.id : undefined;
  return {
    offerId,
    supportedPorts: firstPort ? [firstPort] : [],
    meetingPoint: "",
    durationMinutes: "240",
    minReturnBufferMinutes: "90",
    pickupIncluded: true,
    maxGuests: "8",
    mobilityNotes: "",
    accessibilityNotes: "",
  };
}

function humanizeIsland(value: Offer["island"]) {
  return value === "stt"
    ? "St. Thomas"
    : value === "stj"
      ? "St. John"
      : "St. Croix";
}

function inputClass(extra = "") {
  return `min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600 ${extra}`;
}
