import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Compass,
  CreditCard,
  Hotel,
  KeyRound,
  Inbox,
  MapPinned,
  Megaphone,
  Route,
  ShieldCheck,
  Ship,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

type DeskLink = {
  label: string;
  path: string;
  description: string;
  icon: LucideIcon;
  highlight?: boolean;
};

type DeskSection = {
  title: string;
  subtitle: string;
  links: DeskLink[];
};

function openPath(path: string) {
  window.location.assign(path);
}

const visitorSections: DeskSection[] = [
  {
    title: "Plan the visit",
    subtitle: "The public-facing visitor flow.",
    links: [
      {
        label: "Account",
        path: "/account",
        description: "Sign in as visitor, paid visitor, partner, or admin.",
        icon: Users,
      },
      {
        label: "Visitor Checkout",
        path: "/visitor-checkout",
        description: "Activate a visitor pass and unlock premium planning.",
        icon: CreditCard,
        highlight: true,
      },
      {
        label: "Cruise Planner",
        path: "/cruise-planner",
        description: "Build a cruise-day plan with a road-preview map.",
        icon: Ship,
        highlight: true,
      },
      {
        label: "Visitor Map",
        path: "/map",
        description: "Explore beaches, estates, places, and route context.",
        icon: MapPinned,
      },
      {
        label: "Mobility",
        path: "/mobility",
        description: "Request rides and preview routes.",
        icon: Car,
      },
      {
        label: "Concierge",
        path: "/concierge",
        description: "Ask questions and get local help.",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Book and discover",
    subtitle: "Where visitors turn interest into requests.",
    links: [
      {
        label: "Hotels / Stays",
        path: "/hotels",
        description: "Customer-facing stays, villas, resorts, and charters.",
        icon: Hotel,
        highlight: true,
      },
      {
        label: "Explore",
        path: "/explore",
        description: "Things to do and places to visit.",
        icon: Compass,
      },
      {
        label: "Events",
        path: "/events",
        description: "Local happenings and trip ideas.",
        icon: CalendarDays,
      },
      {
        label: "Beaches",
        path: "/beaches",
        description: "Beach discovery for visitors.",
        icon: BedDouble,
      },
    ],
  },
];

const adminSections: DeskSection[] = [
  {
    title: "Money loop",
    subtitle: "Owner dashboard for revenue, booking, and partner activity.",
    links: [
      {
        label: "Admin Roles",
        path: "/admin-roles",
        description: "Assign real Firebase admin, partner, and visitor claims.",
        icon: ShieldCheck,
        highlight: true,
      },
      {
        label: "Access Status",
        path: "/access-status",
        description: "Verify Firebase claims, Stripe visitor pass, and active gates.",
        icon: ShieldCheck,
        highlight: true,
      },
      {
        label: "Admin Rules / Roles",
        path: "/admin-roles",
        description: "Sign in, refresh Firebase claims, and assign admin, partner, or paid visitor access.",
        icon: KeyRound,
        highlight: true,
      },
      {
        label: "Revenue Dashboard",
        path: "/revenue-dashboard",
        description: "Track MRR, bookings, referral value, and pipeline.",
        icon: BadgeDollarSign,
        highlight: true,
      },
      {
        label: "Booking Inbox",
        path: "/booking-inbox",
        description: "Assign inquiries and mark contacted, quoted, booked, or lost.",
        icon: Inbox,
      },
      {
        label: "Partner Billing",
        path: "/partner-billing",
        description: "Track invoices, paid partners, trials, and overdue accounts.",
        icon: CreditCard,
      },
      {
        label: "Partner Outreach",
        path: "/partner-outreach",
        description: "Contact hotels, villas, charters, and tour operators.",
        icon: Megaphone,
      },
    ],
  },
  {
    title: "Business demo",
    subtitle: "Show the opportunity to taxi, hotel, chamber, and tourism partners.",
    links: [
      {
        label: "Meeting Mode",
        path: "/meeting-mode",
        description: "The guided partner pitch.",
        icon: Sparkles,
        highlight: true,
      },
      {
        label: "Business Demo Hub",
        path: "/demo",
        description: "Main demo page and route tester.",
        icon: Store,
      },
      {
        label: "Direct Booking",
        path: "/direct-booking",
        description: "Customer booking lead capture flow.",
        icon: ClipboardList,
      },
      {
        label: "Dispatch Board",
        path: "/mobility/dispatch",
        description: "Taxi and ride dispatch board.",
        icon: Route,
      },
    ],
  },
];

const partnerSections: DeskSection[] = [
  {
    title: "Partner workspace",
    subtitle: "The management side for hotels, villas, charters, and tour partners.",
    links: [
      {
        label: "Partner Page Manager",
        path: "/accommodation-partner",
        description: "Claim, edit, and manage the public partner profile.",
        icon: Building2,
        highlight: true,
      },
      {
        label: "Accommodation Review",
        path: "/accommodation-review",
        description: "Review submitted partner changes.",
        icon: ClipboardList,
      },
      {
        label: "Partner Outreach",
        path: "/partner-outreach",
        description: "Track outreach status and partner decisions.",
        icon: Megaphone,
      },
      {
        label: "Partner Billing",
        path: "/partner-billing",
        description: "Track trial, invoice, paid, paused, and overdue status.",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Partner results",
    subtitle: "Where partners see leads and performance.",
    links: [
      {
        label: "Booking Inbox",
        path: "/booking-inbox",
        description: "View and assign incoming customer requests.",
        icon: Inbox,
        highlight: true,
      },
      {
        label: "Revenue Dashboard",
        path: "/revenue-dashboard",
        description: "See active pipeline and booked value.",
        icon: BadgeDollarSign,
      },
      {
        label: "Customer Stays",
        path: "/hotels",
        description: "Preview the public catalog.",
        icon: Hotel,
      },
      {
        label: "Booking Partners",
        path: "/booking-partners",
        description: "Track broader direct-booking partner pipeline.",
        icon: Users,
      },
    ],
  },
];

export function VisitorDeskPage() {
  return (
    <DeskPage
      eyebrow="Visitor Desk"
      title="A clean front desk for the visitor-facing app."
      subtitle="This is the public hub for planning, mapping, mobility, stays, and trip discovery."
      primaryLabel="Start with Cruise Planner"
      primaryPath="/cruise-planner"
      sections={visitorSections}
    />
  );
}

export function AdminDeskPage() {
  return (
    <DeskPage
      eyebrow="Admin Desk"
      title="The owner command center for money, partners, and operations."
      subtitle="Use this to run the booking pipeline, partner sales, billing, demos, and dispatch."
      primaryLabel="Open Revenue Dashboard"
      primaryPath="/revenue-dashboard"
      sections={adminSections}
    />
  );
}

export function PartnerDeskPage() {
  return (
    <DeskPage
      eyebrow="Partner Desk"
      title="The partner management workspace."
      subtitle="Hotels, villas, charters, and tour operators can manage pages, leads, billing, and review status."
      primaryLabel="Open Partner Page Manager"
      primaryPath="/accommodation-partner"
      sections={partnerSections}
    />
  );
}

function DeskPage({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryPath,
  sections,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryPath: string;
  sections: DeskSection[];
}) {
  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Sparkles className="h-4 w-4" />
                {eyebrow}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                {subtitle}
              </p>

              <button
                type="button"
                onClick={() => openPath(primaryPath)}
                className="mt-6 rounded-2xl bg-[#ffcf32] px-6 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
              >
                {primaryLabel} →
              </button>
            </div>

            <div className="bg-white/5 p-6 md:p-8">
              <div className="rounded-[2rem] bg-white p-5 text-ink">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Organized routes
                </p>
                <p className="mt-3 text-4xl font-black">
                  {sections.reduce((sum, section) => sum + section.links.length, 0)}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                  grouped into the correct workspace so the app feels organized instead of scattered.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="rounded-[2.5rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                {section.title}
              </p>

              <h2 className="mt-2 text-3xl font-black">{section.subtitle}</h2>

              <div className="mt-5 grid gap-3">
                {section.links.map((link) => (
                  <DeskButton key={link.path} link={link} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function DeskButton({ link }: { link: DeskLink }) {
  const Icon = link.icon;

  return (
    <button
      type="button"
      onClick={() => openPath(link.path)}
      className={`flex items-center justify-between rounded-[1.5rem] p-4 text-left active:scale-95 ${
        link.highlight
          ? "bg-[#ffcf32] text-ink shadow-lg"
          : "bg-stone-50 text-ink"
      }`}
    >
      <span className="flex items-center gap-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl ${
            link.highlight ? "bg-ink text-[#ffcf32]" : "bg-emerald-950 text-turquoise"
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>

        <span>
          <span className="block text-base font-black">{link.label}</span>
          <span className="mt-1 block text-xs font-bold leading-5 text-stone-600">
            {link.description}
          </span>
        </span>
      </span>

      <ArrowRight className="h-5 w-5 shrink-0 text-stone-500" />
    </button>
  );
}
