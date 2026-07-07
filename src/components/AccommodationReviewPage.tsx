import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Eye,
  Hotel,
  Image,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Ship,
  Trash2,
  Waves,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { CustomerBookingCategory } from "../data/customerBookingCatalog";
import {
  accommodationSlugFromText,
  approveAccommodationChangeRequest,
  declineAndRemoveAccommodation,
  readAccommodationChangeRequests,
  readAccommodationPartnerPages,
  rejectAccommodationChangeRequest,
  type AccommodationPageChangeRequest,
} from "../lib/accommodations/accommodationPartnerPages";

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

export default function AccommodationReviewPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState(() => readAccommodationChangeRequests());
  const [pages, setPages] = useState(() => readAccommodationPartnerPages());
  const [statusFilter, setStatusFilter] = useState("pending");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    return {
      pending: requests.filter((item) => item.requestStatus === "pending").length,
      approved: requests.filter((item) => item.requestStatus === "approved").length,
      rejected: requests.filter((item) => item.requestStatus === "rejected").length,
      removed: pages.filter((item) => item.pageStatus === "removed").length,
      active: pages.filter((item) => item.pageStatus === "active_partner").length,
    };
  }, [pages, requests]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.requestStatus === statusFilter;
      const matchesSearch =
        !search ||
        request.businessName.toLowerCase().includes(search) ||
        request.island.toLowerCase().includes(search) ||
        request.category.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [query, requests, statusFilter]);

  const refresh = () => {
    setRequests(readAccommodationChangeRequests());
    setPages(readAccommodationPartnerPages());
  };

  const approve = (requestId: string) => {
    approveAccommodationChangeRequest(requestId);
    refresh();
  };

  const reject = (requestId: string) => {
    rejectAccommodationChangeRequest(requestId, "Rejected in local admin review.");
    refresh();
  };

  const remove = (requestId: string) => {
    declineAndRemoveAccommodation(
      requestId,
      "Business declined partnership or should be removed from public catalog."
    );
    refresh();
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <ShieldCheck className="h-4 w-4" />
                Accommodation Review
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Approve partner page edits before they go live.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                Review claims, page copy, images, booking links, contact info,
                and image permission notes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
              <HeroStat label="Pending" value={stats.pending} icon={ClipboardCheck} />
              <HeroStat label="Active" value={stats.active} icon={CheckCircle2} />
              <HeroStat label="Removed" value={stats.removed} icon={Trash2} />
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[2.25rem] bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {["pending", "approved", "rejected", "declined_removed", "all"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] active:scale-95 ${
                      statusFilter === status
                        ? "bg-emerald-950 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                )
              )}
            </div>

            <label className="relative block lg:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4">
            {filtered.length ? (
              filtered.map((request) => (
                <ReviewCard
                  key={request.requestId}
                  request={request}
                  onApprove={() => approve(request.requestId)}
                  onReject={() => reject(request.requestId)}
                  onRemove={() => remove(request.requestId)}
                  onOpen={() =>
                    navigate(
                      `/hotels/${request.sourceRecordId || accommodationSlugFromText(request.businessName)}`
                    )
                  }
                />
              ))
            ) : (
              <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-emerald-700" />
                <p className="mt-3 text-lg font-black">No review items found</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function ReviewCard({
  request,
  onApprove,
  onReject,
  onRemove,
  onOpen,
}: {
  request: AccommodationPageChangeRequest;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const Icon = categoryMeta[request.category]?.icon || Hotel;

  return (
    <article className="overflow-hidden rounded-[2rem] bg-stone-50 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
        <div className="relative h-64 bg-emerald-950 lg:h-full">
          <img
            src={request.image}
            alt={request.imageAlt || `${request.businessName} accommodation image`}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            {request.imageStatus.replace("_", " ")}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    {categoryMeta[request.category]?.label || request.category} · {request.island}
                  </p>
                  <h2 className="mt-1 text-3xl font-black">{request.businessName}</h2>
                </div>
              </div>

              <p className="mt-4 text-sm font-black text-stone-500">
                {request.area}
              </p>

              <p className="mt-3 text-lg font-black leading-7">
                {request.headline}
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-stone-600">
                {request.description}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 text-sm font-bold text-stone-600 lg:w-[260px]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Contact
              </p>
              <p className="mt-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-700" />
                {request.partnerContactEmail || request.email || "No email"}
              </p>
              <p className="mt-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-700" />
                {request.partnerContactPhone || request.phone || "No phone"}
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                Status: {request.requestStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              <Image className="h-4 w-4" />
              Image permission note
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
              {request.imagePermissionNote || "No permission note submitted."}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <button
              type="button"
              onClick={onOpen}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
            >
              <Eye className="mr-2 inline h-4 w-4" />
              Open
            </button>

            <button
              type="button"
              onClick={onApprove}
              className="rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
            >
              Approve
            </button>

            <button
              type="button"
              onClick={onReject}
              className="rounded-2xl bg-stone-200 px-4 py-3 text-sm font-black text-ink active:scale-95"
            >
              <XCircle className="mr-2 inline h-4 w-4" />
              Reject
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-700 active:scale-95"
            >
              <Trash2 className="mr-2 inline h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
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
