import Link from "next/link";

import { DriverRosterBoard } from "@/components/drivers-board";

export default function DriversPage() {
  return (
    <>
      <div className="bg-[#f7f2e7] px-4 pt-5 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-2">
          <AdminAction
            eyebrow="Merchant acquisition"
            title="Review new partner applications and move approved businesses into onboarding."
            href="/admin/partner-applications"
            label="Review applications"
          />
          <AdminAction
            eyebrow="Business access"
            title="Assign approved merchant accounts to their authorized VI Guide listings."
            href="/admin/merchants"
            label="Manage merchants"
          />
        </div>
      </div>
      <DriverRosterBoard />
    </>
  );
}

function AdminAction({
  eyebrow,
  title,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  href: string;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[#043331] shadow-sm">
      <div className="max-w-xl">
        <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">
          {eyebrow}
        </p>
        <p className="mt-1 text-sm font-bold leading-6">{title}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-xl bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
      >
        {label}
      </Link>
    </div>
  );
}
