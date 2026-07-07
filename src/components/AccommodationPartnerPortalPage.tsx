import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  Hotel,
  Image,
  Inbox,
  Link,
  Mail,
  MapPin,
  Phone,
  Search,
  Ship,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  enrichedCustomerBookingCatalog,
  type CustomerBookingCategory,
  type CustomerBookingRecord,
} from "../data/customerBookingCatalog";
import { generatedCustomerBookingCatalog } from "../data/customerBookingCatalog.generated";
import {
  accommodationSlug,
  applyAccommodationPartnerOverrides,
  createPartnerPageFromRecord,
  readAccommodationChangeRequests,
  submitAccommodationChangeRequest,
  type AccommodationPartnerPage,
} from "../lib/accommodations/accommodationPartnerPages";

type BookingRequest = {
  id: string;
  category: string;
  guestName: string;
  phone: string;
  email: string;
  island: string;
  preferredArea: string;
  dates: string;
  partySize: string;
  budget: string;
  notes: string;
  requestedPartnerId?: string;
  requestedPartnerName?: string;
  createdAt: string;
};

const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";

const categoryMeta: Record<
  CustomerBookingCategory,
  { label: string; icon: LucideIcon }
> = {
  hotel: { label: "Hotel", icon: Hotel },
  resort: { label: "Resort", icon: Building2 },
  villa: { label: "Villa", icon: BedDouble },
  airbnb_operator: { label: "Vacation Rental", icon: BedDouble },
  boat_charter: { label: "Boat Charter", icon: Ship },
  tour_operator: { label: "Tour", icon: Compass },
  excursion_company: { label: "Excursion", icon: Waves },
};

function readRequests(): BookingRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKING_REQUESTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function catalogRecords(): CustomerBookingRecord[] {
  const combined: CustomerBookingRecord[] = [
    ...generatedCustomerBookingCatalog,
    ...enrichedCustomerBookingCatalog,
  ];

  const seen = new Set<string>();
  const deduped = combined.filter((record) => {
    const key = `${record.category}-${record.island}-${record.businessName}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return applyAccommodationPartnerOverrides(deduped);
}

export default function AccommodationPartnerPortalPage() {
  const navigate = useNavigate();

  const records = useMemo(() => catalogRecords(), []);
  const [requests] = useState<BookingRequest[]>(() => readRequests());
  const [changeRequests, setChangeRequests] = useState(() =>
    readAccommodationChangeRequests()
  );

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(records[0]?.id || "");
  const selectedRecord =
    records.find((record) => record.id === selectedId) || records[0];

  const [form, setForm] = useState<AccommodationPartnerPage | null>(() =>
    selectedRecord ? createPartnerPageFromRecord(selectedRecord) : null
  );
  const [saved, setSaved] = useState(false);

  const filteredRecords = useMemo(() => {
    const search = query.trim().toLowerCase();

    return records.filter((record) => {
      if (!search) return true;

      return (
        record.businessName.toLowerCase().includes(search) ||
        record.island.toLowerCase().includes(search) ||
        record.area.toLowerCase().includes(search) ||
        record.category.toLowerCase().includes(search)
      );
    });
  }, [query, records]);

  const matchingInquiries = useMemo(() => {
    if (!selectedRecord) return [];

    const name = selectedRecord.businessName.toLowerCase();

    return requests.filter((request) => {
      return (
        request.requestedPartnerId === selectedRecord.id ||
        request.requestedPartnerName?.toLowerCase() === name ||
        request.preferredArea?.toLowerCase().includes(name)
      );
    });
  }, [requests, selectedRecord]);

  const pendingForSelected = useMemo(() => {
    if (!selectedRecord) return [];

    return changeRequests.filter(
      (request) =>
        request.sourceRecordId === selectedRecord.id &&
        request.requestStatus === "pending"
    );
  }, [changeRequests, selectedRecord]);

  const selectRecord = (record: CustomerBookingRecord) => {
    setSelectedId(record.id);
    setForm(createPartnerPageFromRecord(record));
    setSaved(false);
  };

  const updateForm = <K extends keyof AccommodationPartnerPage>(
    key: K,
    value: AccommodationPartnerPage[K]
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const request = submitAccommodationChangeRequest({
      ...form,
      slug: accommodationSlug({
        id: form.sourceRecordId,
        businessName: form.businessName,
      }),
      bestFor: form.bestFor.filter(Boolean),
      pageStatus: "claim_requested",
    });

    setChangeRequests(readAccommodationChangeRequests());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);

    return request;
  };

  if (!selectedRecord || !form) {
    return (
      <main className="min-h-screen bg-[#f8f0da] p-6 text-ink">
      <section className="mx-auto max-w-7xl px-4 pt-5">
        <button
          type="button"
          onClick={() => window.location.assign("/partner-desk")}
          className="mb-5 flex w-full items-center justify-between rounded-[2rem] bg-[#ffcf32] px-6 py-5 text-left text-ink shadow-xl active:scale-95"
        >
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.22em] text-emerald-900">
              Organized partner app
            </span>
            <span className="mt-1 block text-2xl font-black">Partner Desk</span>
            <span className="mt-1 block text-sm font-bold text-stone-700">
              Manage profile, leads, review status, billing, and partner workflow.
            </span>
          </span>
          <span className="text-2xl font-black">→</span>
        </button>
      </section>


        <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <Hotel className="mx-auto h-12 w-12 text-emerald-700" />
          <h1 className="mt-4 text-3xl font-black">No accommodations found</h1>
        </section>
      </main>
    );
  }

  const Icon = categoryMeta[selectedRecord.category].icon;

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Sparkles className="h-4 w-4" />
                Accommodation Partner Portal
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Claim and manage your public booking page.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                Hotels, resorts, villas, charters, tours, and excursion partners
                submit profile changes here. Public pages update after admin review.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
              <HeroStat label="Listings" value={records.length} icon={Hotel} />
              <HeroStat label="Inquiries" value={requests.length} icon={Inbox} />
              <HeroStat label="Pending" value={changeRequests.filter((item) => item.requestStatus === "pending").length} icon={ClipboardList} />
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Select listing
              </p>

              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search hotel, villa, charter..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
                />
              </label>

              <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
                {filteredRecords.map((record) => {
                  const RecordIcon = categoryMeta[record.category].icon;
                  const active = record.id === selectedRecord.id;

                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => selectRecord(record)}
                      className={`w-full rounded-2xl p-3 text-left active:scale-95 ${
                        active ? "bg-emerald-950 text-white" : "bg-stone-50 text-ink"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RecordIcon
                          className={`mt-1 h-5 w-5 shrink-0 ${
                            active ? "text-turquoise" : "text-emerald-700"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-black">{record.businessName}</p>
                          <p
                            className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              active ? "text-white/55" : "text-stone-400"
                            }`}
                          >
                            {categoryMeta[record.category].label} · {record.island}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Eye className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-2xl font-black">Public page</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-white/65">
                Copy or open the live customer-facing page for this accommodation.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/hotels/${accommodationSlug(selectedRecord)}`)}
                className="mt-5 w-full rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Public Page
              </button>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="overflow-hidden rounded-[2.25rem] bg-white shadow-xl">
              <div className="relative h-64 bg-emerald-950">
                <img
                  src={form.image}
                  alt={form.imageAlt || `${form.businessName} accommodation image`}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                  <Icon className="h-4 w-4" />
                  {categoryMeta[selectedRecord.category].label}
                </div>
              </div>

              <form onSubmit={submit} className="p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                      Page profile
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      {form.businessName}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-stone-500">
                      Edits submit to review. Approved edits override the catalog.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
                  >
                    {saved ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                    {saved ? "Submitted" : "Submit for Review"}
                  </button>
                </div>

                {pendingForSelected.length ? (
                  <div className="mt-5 rounded-2xl bg-yellow-50 p-4 text-sm font-bold text-yellow-900">
                    This listing already has {pendingForSelected.length} pending change request.
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Business name" value={form.businessName} onChange={(value) => updateForm("businessName", value)} icon={Hotel} />
                  <SelectField
                    label="Category"
                    value={form.category}
                    onChange={(value) => updateForm("category", value as CustomerBookingCategory)}
                    options={Object.entries(categoryMeta).map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    }))}
                  />
                  <Field label="Island" value={form.island} onChange={(value) => updateForm("island", value)} icon={MapPin} />
                  <Field label="Area" value={form.area} onChange={(value) => updateForm("area", value)} icon={MapPin} />
                  <Field label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} icon={Phone} />
                  <Field label="Email" value={form.email} onChange={(value) => updateForm("email", value)} icon={Mail} />
                  <Field label="Website" value={form.website} onChange={(value) => updateForm("website", value)} icon={Link} />
                  <Field label="Booking email" value={form.bookingEmail} onChange={(value) => updateForm("bookingEmail", value)} icon={Mail} />
                  <Field label="Official booking URL" value={form.officialBookingUrl} onChange={(value) => updateForm("officialBookingUrl", value)} icon={Link} />
                  <Field label="Hero image URL" value={form.image} onChange={(value) => updateForm("image", value)} icon={Image} />
                  <Field label="Image source URL" value={form.imageSourceUrl} onChange={(value) => updateForm("imageSourceUrl", value)} icon={Link} />
                  <Field label="Partner contact name" value={form.partnerContactName} onChange={(value) => updateForm("partnerContactName", value)} icon={Users} />
                  <Field label="Partner contact email" value={form.partnerContactEmail} onChange={(value) => updateForm("partnerContactEmail", value)} icon={Mail} />
                  <Field label="Partner contact phone" value={form.partnerContactPhone} onChange={(value) => updateForm("partnerContactPhone", value)} icon={Phone} />
                </div>

                <div className="mt-4 grid gap-4">
                  <TextArea label="Headline" value={form.headline} onChange={(value) => updateForm("headline", value)} />
                  <TextArea label="Description" value={form.description} onChange={(value) => updateForm("description", value)} />
                  <TextArea label="Best for tags, comma separated" value={form.bestFor.join(", ")} onChange={(value) => updateForm("bestFor", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                  <TextArea label="Booking offer" value={form.bookingOffer} onChange={(value) => updateForm("bookingOffer", value)} />
                  <TextArea label="Mobility note" value={form.mobilityNote} onChange={(value) => updateForm("mobilityNote", value)} />
                  <TextArea label="Seasonal offer" value={form.seasonalOffer} onChange={(value) => updateForm("seasonalOffer", value)} />
                  <TextArea label="Image permission note" value={form.imagePermissionNote} onChange={(value) => updateForm("imagePermissionNote", value)} />
                </div>
              </form>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Booking inquiries
              </p>
              <h2 className="mt-2 text-3xl font-black">
                {matchingInquiries.length} inquiry matches
              </h2>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/accommodation-review")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Review Queue
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/partner-outreach")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Partner Outreach
                </button>

                {matchingInquiries.length ? (
                  matchingInquiries.map((request) => (
                    <article key={request.id} className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm font-black">{request.guestName}</p>
                      <p className="mt-1 text-xs font-bold text-stone-500">
                        {request.dates || "Dates not provided"} · {request.partySize || "Party size not provided"}
                      </p>
                      <p className="mt-3 text-sm font-bold leading-6 text-stone-700">
                        {request.notes || "No notes provided."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        {request.phone ? <span className="rounded-full bg-white px-3 py-1">{request.phone}</span> : null}
                        {request.email ? <span className="rounded-full bg-white px-3 py-1">{request.email}</span> : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl bg-stone-50 p-6 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-emerald-700" />
                    <p className="mt-3 text-sm font-black">
                      No inquiries for this listing yet.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 py-4 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-black outline-none focus:border-emerald-700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
      />
    </label>
  );
}
