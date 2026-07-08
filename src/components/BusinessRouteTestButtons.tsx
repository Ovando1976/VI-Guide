const businessRoutes = [
  {
    group: "Money Loop",
    links: [
      { label: "Revenue Dashboard", path: "/revenue-dashboard" },
      { label: "Booking Inbox", path: "/booking-inbox" },
      { label: "Partner Billing", path: "/partner-billing" },
      { label: "Partner Outreach", path: "/partner-outreach" },
    ],
  },
  {
    group: "Accommodation System",
    links: [
      { label: "Customer Stays", path: "/hotels" },
      { label: "Sample Hotel Detail", path: "/hotels/the-ritz-carlton-st-thomas" },
      { label: "Partner Page Manager", path: "/accommodation-partner" },
      { label: "Accommodation Review", path: "/accommodation-review" },
    ],
  },
  {
    group: "Sales Demo",
    links: [
      { label: "Meeting Mode", path: "/meeting-mode" },
      { label: "Direct Booking", path: "/direct-booking" },
      { label: "Booking Partners", path: "/booking-partners" },
      { label: "Partner Pipeline", path: "/partner-pipeline" },
    ],
  },
  {
    group: "Mobility",
    links: [
      { label: "Mobility Request", path: "/mobility" },
      { label: "Dispatch Board", path: "/mobility/dispatch" },
      { label: "Business Proof", path: "/business-proof" },
      { label: "Tourism Alliance", path: "/tourism-alliance" },
    ],
  },
];

export default function BusinessRouteTestButtons() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-5">
      <div className="rounded-[2.5rem] bg-white p-5 text-ink shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Business route tester
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Test the money, partner, booking, and mobility routes
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-stone-500">
              These buttons are for demos and admin testing only. They should live in the business hub, not the public home screen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.assign("/revenue-dashboard")}
            className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink shadow-lg active:scale-95"
          >
            Open Revenue Dashboard →
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {businessRoutes.map((group) => (
            <div key={group.group} className="rounded-[2rem] bg-stone-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                {group.group}
              </p>

              <div className="mt-3 grid gap-2">
                {group.links.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => window.location.assign(link.path)}
                    className="rounded-2xl bg-white px-4 py-3 text-left text-sm font-black text-ink shadow-sm active:scale-95"
                  >
                    {link.label}
                    <span className="float-right text-stone-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
