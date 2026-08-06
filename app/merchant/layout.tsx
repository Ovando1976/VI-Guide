import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import { getSession } from "@/lib/auth-server";
import { humanizeListingId } from "@/lib/merchant-portal";

const MERCHANT_ROLES = new Set(["merchant", "dispatcher", "admin"]);

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant");
  if (!MERCHANT_ROLES.has(session.role)) redirect("/unauthorized");

  const listingIds = session.role === "merchant" ? session.listingIds ?? [] : [];
  const roleLabel =
    session.role === "merchant"
      ? "Merchant account"
      : session.role === "dispatcher"
        ? "Operations dispatcher"
        : "Administrator";

  return (
    <div className="min-h-screen bg-[#f8f4ea] text-[#043331]">
      <header className="border-b border-[#043331]/10 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                VI Guide business console
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-lg font-black tracking-[-.03em]">
                  {session.name || session.email || "Business operations"}
                </p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.13em] text-emerald-800">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <nav className="grid gap-2 sm:grid-cols-5">
            <MerchantNavLink
              href="/merchant"
              icon={LayoutDashboard}
              label="Overview"
            />
            <MerchantNavLink
              href="/merchant/reservations"
              icon={CalendarClock}
              label="Reservations"
            />
            <MerchantNavLink
              href="/merchant/availability"
              icon={ShieldCheck}
              label="Availability"
            />
            <MerchantNavLink
              href="/merchant/offers"
              icon={BadgeDollarSign}
              label="Offers"
            />
            <MerchantNavLink
              href="/merchant/lifecycle"
              icon={CreditCard}
              label="Payments"
            />
          </nav>
        </div>

        {session.role === "merchant" ? (
          <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
              Assigned businesses
            </span>
            {listingIds.length ? (
              listingIds.map((listingId) => (
                <Link
                  key={listingId}
                  href={`/merchant/availability?listingId=${encodeURIComponent(listingId)}`}
                  className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[9px] font-black text-teal-800 transition hover:border-teal-300"
                >
                  {humanizeListingId(listingId)}
                </Link>
              ))
            ) : (
              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[9px] font-black text-rose-700">
                No listing scope assigned
              </span>
            )}
          </div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function MerchantNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] transition hover:border-teal-300 hover:bg-teal-50"
    >
      <Icon className="h-4 w-4 text-teal-700" />
      {label}
    </Link>
  );
}
