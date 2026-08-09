import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CircleDollarSign,
  Compass,
  FileCheck2,
  MailCheck,
  ShipWheel,
  Store,
  UsersRound,
  WalletCards,
  BarChart3,
} from "lucide-react";

import { DriverRosterBoard } from "@/components/drivers-board";
import { getSession } from "@/lib/auth-server";

type AdminActionDefinition = {
  href: string;
  icon: typeof Store;
  eyebrow: string;
  detail: string;
  action: string;
};

const SHARED_ACTIONS: AdminActionDefinition[] = [
  {
    href: "/admin/travel-requests",
    icon: Compass,
    eyebrow: "Travel advisor",
    detail:
      "Review qualified USVI trip-planning leads and move them from intent to itinerary and booking.",
    action: "Open travel desk",
  },
  {
    href: "/admin/travel-proposals",
    icon: FileCheck2,
    eyebrow: "Traveler proposals",
    detail:
      "Publish a saved My Trip itinerary as a privacy-safe traveler proposal, then queue delivery through VI Guide.",
    action: "Open proposals",
  },
  {
    href: "/admin/cruise-requests",
    icon: ShipWheel,
    eyebrow: "Cruise advisor",
    detail:
      "Research cruise-planning requests, preserve advisor context, and move qualified leads toward booking.",
    action: "Open cruise desk",
  },
  {
    href: "/admin/partner-applications",
    icon: UsersRound,
    eyebrow: "Merchant acquisition",
    detail:
      "Review partner applications, assign follow-up, and move approved businesses into onboarding.",
    action: "Review applications",
  },
  {
    href: "/admin/notifications",
    icon: MailCheck,
    eyebrow: "Delivery operations",
    detail:
      "Inspect booking emails, delivery failures, unresolved recipients, and audited retries.",
    action: "Open notifications",
  },
];

const ADMIN_ONLY_ACTIONS: AdminActionDefinition[] = [
  {
    href: "/admin/customer-insights",
    icon: BarChart3,
    eyebrow: "Traveler intelligence",
    detail:
      "See unmet searches, real-world trip outcomes, support friction, and consent-aware product signals.",
    action: "Open insights",
  },
  {
    href: "/admin/merchants",
    icon: Store,
    eyebrow: "Business access",
    detail:
      "Assign approved merchant accounts to their authorized VI Guide listings.",
    action: "Manage merchants",
  },
  {
    href: "/admin/commerce-ledger",
    icon: CircleDollarSign,
    eyebrow: "Financial operations",
    detail:
      "Review Stripe-verified captures, refund reversals, fee reserves, and merchant settlement obligations.",
    action: "Open accounting",
  },
  {
    href: "/admin/commerce-settlements",
    icon: WalletCards,
    eyebrow: "Marketplace payouts",
    detail:
      "Release completed merchant settlements through Stripe Connect and reverse them safely before refunds.",
    action: "Open settlements",
  },
];

export default async function DriversPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin" && session.role !== "dispatcher") {
    redirect("/unauthorized");
  }

  const isAdmin = session.role === "admin";
  const actions = isAdmin
    ? [...SHARED_ACTIONS, ...ADMIN_ONLY_ACTIONS]
    : SHARED_ACTIONS;

  return (
    <>
      <div className="bg-[#f7f2e7] px-4 pt-5 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {!isAdmin ? (
            <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold leading-6 text-sky-950">
              <strong>Dispatcher workspace.</strong> Operational review, travel
              desks, partner intake, notifications, fleet, and read-only payout
              review remain available here. Merchant account assignment and
              financial settlement controls stay administrator-only.
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((item) => (
              <AdminAction key={item.href} {...item} />
            ))}
          </div>
        </div>
      </div>
      <DriverRosterBoard />
    </>
  );
}

function AdminAction({
  href,
  icon: Icon,
  eyebrow,
  detail,
  action,
}: AdminActionDefinition) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[#043331] shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">
            {eyebrow}
          </p>
          <p className="mt-1 text-sm font-bold leading-5">{detail}</p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-xl bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
      >
        {action}
      </Link>
    </div>
  );
}
