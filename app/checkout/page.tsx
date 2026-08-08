import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CreditCard,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function CheckoutLandingPage() {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f8f4ea] px-4 pb-32 pt-6 text-[#043331] sm:px-6 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[38px] shadow-[0_30px_90px_rgba(4,51,49,.2)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/usvi-harbor-hero.jpg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,39,38,.97)_0%,rgba(3,47,45,.87)_48%,rgba(3,47,45,.45)_100%)]" />

          <div className="relative grid min-h-[430px] gap-8 p-7 text-white sm:p-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                <ShieldCheck className="h-4 w-4" /> VI Guide secure payment hub
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">
                Pay from the booking that created the charge.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                VI Guide keeps ride payments and travel-request payments attached to the protected booking record that produced them. That prevents a checkout page from guessing the traveler, supplier, route, or amount.
              </p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[.16em] text-white/50">
                Virgin Islands photography shown as territory context.
              </p>
            </div>

            <div className="grid gap-3">
              <TrustLine
                icon={CreditCard}
                title="Protected amount"
                copy="Payment starts from a specific server-side booking record."
              />
              <TrustLine
                icon={ShieldCheck}
                title="Lifecycle checked"
                copy="Paid, refunded, cancelled, disputed, or review-held bookings do not reopen payment."
              />
              <TrustLine
                icon={Route}
                title="Returns to the trip"
                copy="Ride checkout returns to My Trip for dispatch and tracking after verification."
              />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <JourneyCard
            icon={Route}
            eyebrow="Ride payment"
            title="Pay an existing VI Guide ride"
            copy="If a ride has an unpaid regulated fare, open My Trip and continue from that booking. The secure ride checkout verifies the booking amount before Stripe payment starts."
            primaryHref="/trips"
            primaryLabel="Open My Trip"
            secondaryHref="/mobility"
            secondaryLabel="Book a ride"
          />
          <JourneyCard
            icon={BedDouble}
            eyebrow="Stays, tours & experiences"
            title="Continue from My Bookings"
            copy="Accommodation, tour, experience, and advisor-linked requests follow the commerce booking lifecycle. Check the request first; any approved payment action stays attached to that booking instead of this ride checkout."
            primaryHref="/bookings"
            primaryLabel="Open My Bookings"
            secondaryHref="/experiences"
            secondaryLabel="Browse experiences"
          />
        </section>

        <section className="flex flex-col gap-4 rounded-[30px] border border-teal-900/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
              <Sparkles className="h-4 w-4" /> Not sure which booking you need?
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
              Keep the payment attached to the trip context.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Use My Bookings for travel requests or My Trip for rides. VI Guide will surface the next valid action from the protected record rather than asking you to enter an amount manually.
            </p>
          </div>
          <Link
            href="/concierge?prompt=Help%20me%20find%20the%20right%20VI%20Guide%20booking%20or%20payment%20step"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white"
          >
            Ask Concierge <ArrowRight className="h-4 w-4 text-[#f5c451]" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function JourneyCard({
  icon: Icon,
  eyebrow,
  title,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: typeof Route;
  eyebrow: string;
  title: string;
  copy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6f2] text-teal-700">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{copy}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={primaryHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
        >
          <MapPinned className="h-4 w-4 text-[#f5c451]" /> {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-[#fbfaf6] px-5 text-[9px] font-black uppercase tracking-[.14em]"
        >
          {secondaryLabel}
        </Link>
      </div>
    </article>
  );
}

function TrustLine({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof CreditCard;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-white/12 bg-white/[.08] p-4 backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f7d778]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-black">{title}</div>
        <div className="mt-1 text-xs font-semibold leading-5 text-white/58">{copy}</div>
      </div>
    </div>
  );
}
