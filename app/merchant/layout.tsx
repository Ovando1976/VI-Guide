import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

import { MerchantConsoleNav } from "@/components/merchant/merchant-console-nav";
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
  const firstListingId = listingIds[0] ?? "";
  const availabilityHref = firstListingId
    ? `/merchant/availability?listingId=${encodeURIComponent(firstListingId)}`
    : "/merchant/availability";
  const roleLabel =
    session.role === "merchant"
      ? "Merchant account"
      : session.role === "dispatcher"
        ? "Operations dispatcher"
        : "Administrator";

  return (
    <div className="min-h-screen bg-[#f8f4ea] text-[#043331]">
      <header className="sticky top-0 z-[1200] border-b border-[#f5c451]/20 bg-[linear-gradient(135deg,rgba(3,47,45,.985),rgba(7,80,76,.985))] px-4 py-4 text-white shadow-[0_14px_40px_rgba(3,47,45,.22)] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#043331] shadow-[0_8px_24px_rgba(245,196,81,.18)]">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                USVI Explorer business operations
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-lg font-black tracking-[-.03em] text-white">
                  {session.name || session.email || "Business operations"}
                </p>
                <span className="rounded-full border border-white/10 bg-white/[.08] px-3 py-1 text-[8px] font-black uppercase tracking-[.13em] text-white/75">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <MerchantConsoleNav
            showPayouts={session.role === "merchant"}
            availabilityHref={availabilityHref}
          />
        </div>

        {session.role === "merchant" ? (
          <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <span className="text-[8px] font-black uppercase tracking-[.14em] text-white/[.45]">
              Assigned businesses
            </span>
            {listingIds.length ? (
              listingIds.map((listingId) => (
                <Link
                  key={listingId}
                  href={`/merchant/availability?listingId=${encodeURIComponent(listingId)}`}
                  className="rounded-full border border-[#f5c451]/20 bg-[#f5c451]/10 px-3 py-1.5 text-[9px] font-black text-[#ffe9a9] transition hover:border-[#f5c451]/[.45] hover:bg-[#f5c451]/[.15]"
                >
                  {humanizeListingId(listingId)}
                </Link>
              ))
            ) : (
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-[9px] font-black text-rose-100">
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
