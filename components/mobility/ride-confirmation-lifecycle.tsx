import { Check, CreditCard, Radio, ShieldCheck } from "lucide-react";

const STAGES = [
  { label: "Request ride", detail: "Save route, guests, timing, and official fare.", icon: Check },
  { label: "Pay securely", detail: "Complete card payment for the booking request.", icon: CreditCard },
  { label: "Dispatch", detail: "A participating dispatcher matches an available authorized operator.", icon: Radio },
  { label: "Ride confirmed", detail: "Your booking record shows the assigned operator and trip status.", icon: ShieldCheck },
] as const;

export function RideConfirmationLifecycle() {
  return (
    <section className="mt-5 overflow-hidden rounded-[24px] border border-[#b9ddd8] bg-[#f1fbf8]" aria-labelledby="ride-confirmation-lifecycle-title">
      <div className="border-b border-[#cfe7e3] px-4 py-4 sm:px-5">
        <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">What happens after this screen</p>
        <h4 id="ride-confirmation-lifecycle-title" className="mt-1 text-lg font-black tracking-[-.025em] text-[#043331]">A paid request is not a confirmed driver yet.</h4>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Your ride becomes confirmed when dispatch assigns an authorized operator. You will be able to see that status in the booking record.</p>
      </div>
      <ol className="grid gap-px bg-[#cfe7e3] sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <li key={stage.label} className="bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#043331] text-white"><Icon className="h-4 w-4" /></span>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-teal-700">0{index + 1}</div>
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
