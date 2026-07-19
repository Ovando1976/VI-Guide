"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DriverProfile, VehicleRecord } from "@/types/driver";
import type { TaxiAssociation } from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

const FIELD = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none focus:border-[#0f766e]";

export function TaxiOperationsBoard() {
  const [associations, setAssociations] = useState<TaxiAssociation[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stops = [
      onSnapshot(collection(db, "taxiAssociations"), (snapshot) => setAssociations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaxiAssociation))),
      onSnapshot(collection(db, "drivers"), (snapshot) => setDrivers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as DriverProfile))),
      onSnapshot(collection(db, "vehicles"), (snapshot) => setVehicles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as VehicleRecord))),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const eligibleDrivers = useMemo(
    () => drivers.filter((driver) => driver.verified && driver.authorizationStatus === "active" && driver.associationId && driver.vehicleId),
    [drivers],
  );

  async function onboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const islands = form.getAll("islands") as IslandCode[];
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/admin/taxi-operations/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          islands,
          attested: form.get("attested") === "on",
          passengerCapacity: Number(form.get("passengerCapacity")),
          luggageCapacity: Number(form.get("luggageCapacity")),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Onboarding failed.");
      setMessage(`Operator onboarded. Driver ${json.driverId} remains offline until the driver role is granted and availability is enabled.`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Onboarding failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 text-[#043331]">
      <div className="rounded-[32px] bg-[#043331] p-7 text-white">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-amber-300">Regulated taxi operations</div>
        <h1 className="mt-3 text-4xl font-black">Associations, drivers & fleets</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-white/70">Only reviewed Commission credentials and active association fleet records become eligible for dispatch.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Active associations" value={associations.filter((item) => item.status === "active").length} />
        <Metric label="Credentialed drivers" value={eligibleDrivers.length} />
        <Metric label="Active fleet vehicles" value={vehicles.filter((item) => item.active).length} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 text-xs font-black uppercase tracking-[0.2em]">Taxi associations</div>
          <div className="divide-y divide-slate-100">
            {associations.map((association) => (
              <div key={association.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3"><div className="font-black">{association.name}</div><Status value={association.status} /></div>
                <div className="mt-1 text-sm text-slate-500">{association.islands.join(" · ").toUpperCase()} · {drivers.filter((driver) => driver.associationId === association.id).length} drivers · {vehicles.filter((vehicle) => vehicle.associationId === association.id).length} vehicles</div>
              </div>
            ))}
            {!associations.length ? <div className="px-5 py-8 text-sm font-semibold text-slate-500">No reviewed taxi associations have been imported.</div> : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Reviewed onboarding</div>
          <h2 className="mt-2 text-2xl font-black">Add an association operator</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">This creates the association, driver, vehicle, and immutable audit record together. Do not enter unverified information.</p>
          <form onSubmit={onboard} className="mt-6 space-y-6">
            <Group title="Review">
              <Input name="reviewReference" label="Review reference" placeholder="Commission record, file, or internal case ID" />
              <div className="grid gap-3 sm:grid-cols-2"><Input name="associationName" label="Association name" /><Input name="associationRegistrationId" label="Registration ID" /></div>
              <div className="flex flex-wrap gap-4">{(["stt", "stj", "stx"] as IslandCode[]).map((island) => <label key={island} className="flex items-center gap-2 text-sm font-black uppercase"><input type="checkbox" name="islands" value={island} />{island}</label>)}</div>
            </Group>
            <Group title="Driver credentials">
              <div className="grid gap-3 sm:grid-cols-2"><Input name="driverUid" label="Firebase Auth UID" /><Input name="driverName" label="Legal driver name" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input name="driverPhone" label="Phone" /><Input name="badgeNumber" label="Commission badge number" /></div>
              <div className="grid gap-3 sm:grid-cols-3"><Input name="badgeExpiresAt" label="Badge expiration" type="date" /><Input name="licenseClass" label="License class" /><Input name="licenseExpiresAt" label="License expiration" type="date" /></div>
            </Group>
            <Group title="Fleet vehicle">
              <div className="grid gap-3 sm:grid-cols-3"><Input name="make" label="Make" /><Input name="model" label="Model" /><Input name="color" label="Color" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input name="taxiPlate" label="Taxi plate" /><Input name="medallionNumber" label="Medallion number" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input name="passengerCapacity" label="Passenger capacity" type="number" /><Input name="luggageCapacity" label="Luggage capacity" type="number" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><Input name="inspectionExpiresAt" label="Inspection expiration" type="date" /><Input name="insuranceExpiresAt" label="Insurance expiration" type="date" /></div>
            </Group>
            <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950"><input type="checkbox" name="attested" className="mt-1" required /><span>I attest that I reviewed the source records and that the association, driver, and vehicle credentials are current and accurate.</span></label>
            {message ? <div className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold">{message}</div> : null}
            <button disabled={submitting} className="w-full rounded-full bg-[#043331] px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-60">{submitting ? "Saving reviewed operator…" : "Onboard reviewed operator"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="space-y-3"><legend className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</legend>{children}</fieldset>; }
function Input({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) { return <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><input required name={name} type={type} placeholder={placeholder} className={FIELD} /></label>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="text-3xl font-black">{value}</div><div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div></div>; }
function Status({ value }: { value: string }) { return <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${value === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{value}</span>; }

