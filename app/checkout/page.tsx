import Link from "next/link";
import { CreditCard, Route } from "lucide-react";

export default function CheckoutLandingPage() {
  return <main className="grid min-h-screen place-items-center px-4 py-16 text-[#043331]">
    <section className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(4,51,49,.12)]">
      <div className="bg-[linear-gradient(135deg,#043331,#0b5d5b)] p-7 text-white sm:p-9">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-[#043331]"><CreditCard size={22} /></div>
        <h1 className="mt-6 text-3xl font-black tracking-[-.04em] sm:text-4xl">Secure ride checkout</h1>
        <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-teal-50/75">Payment opens from a specific booking so the fare, rider, and route can be verified securely.</p>
      </div>
      <div className="p-7 sm:p-9">
        <div className="rounded-[22px] border border-slate-200 bg-[#f8f4ea] p-5 text-sm font-semibold leading-6 text-slate-600">Choose an unpaid trip from your trip center, or create a new ride request. VI Guide calculates the payment amount from the protected server booking.</div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/trips" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 py-3.5 text-[10px] font-black uppercase tracking-[.18em] text-white"><Route size={16} />Open my trips</Link>
          <Link href="/mobility" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 text-[10px] font-black uppercase tracking-[.18em]">Book a ride</Link>
        </div>
      </div>
    </section>
  </main>;
}
