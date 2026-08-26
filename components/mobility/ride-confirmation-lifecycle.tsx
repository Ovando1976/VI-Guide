import { Check, CreditCard, MapPin, Radio, ShieldCheck } from "lucide-react";

const STAGES = [
  {
    label: "Request saved",
    detail: "Your route, travelers, timing, notes, and governed fare are saved.",
    icon: Check,
  },
  {
    label: "Secure payment",
    detail: "Complete card payment to start dispatch for this request.",
    icon: CreditCard,
  },
  {
    label: "Driver matching",
    detail: "Dispatch looks for an available authorized operator for your trip.",
    icon: Radio,
  },
  {
    label: "Driver assigned",
    detail: "This is the point when the ride becomes confirmed.",
    icon: ShieldCheck,
  },
  {
    label: "Track in My Trip",
    detail: "Follow driver status, pickup, and trip progress from one place.",
    icon: MapPin,
  },
] as const;

export function RideConfirmationLifecycle() {
  return (
    <section
      className="mt-5 overflow-hidden rounded-[24px] border border-[#b9ddd8] bg-[#f1fbf8]"
      aria-labelledby="ride-confirmation-lifecycle-title"
    >
      <div className="border-b border-[#cfe7e3] px-4 py-4 sm:px-5">
        <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
          After you confirm
        </p>
        <h4
          id="ride-confirmation-lifecycle-title"
          className="mt-1 text-lg font-black tracking-[-.025em] text-[#043331]"
        >
          Payment starts dispatch. Driver assignment confirms the ride.
        </h4>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Confirming here creates the protected ride request; it does not claim that a driver is already assigned. Once an authorized driver accepts, My Trip becomes your live status view.
        </p>
      </div>

      <ol className="grid gap-px bg-[#cfe7e3] sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <li key={stage.label} className="bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#043331] text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-teal-700">
                    0{index + 1}
                  </div>
                  <div className="text-sm font-black text-[#043331]">{stage.label}</div>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{stage.detail}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
