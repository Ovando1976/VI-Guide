"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ShieldCheck } from "lucide-react";

import { db } from "@/lib/firebase";
import type { DriverProfile, VehicleRecord } from "@/types/driver";
import type { TaxiAssociation } from "@/types/taxi-operations";

export function DispatcherTaxiOperationsBoard() {
  const [associations, setAssociations] = useState<TaxiAssociation[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  useEffect(() => {
    const stops = [
      onSnapshot(collection(db, "taxiAssociations"), (snapshot) =>
        setAssociations(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as TaxiAssociation,
          ),
        ),
      ),
      onSnapshot(collection(db, "drivers"), (snapshot) =>
        setDrivers(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as DriverProfile,
          ),
        ),
      ),
      onSnapshot(collection(db, "vehicles"), (snapshot) =>
        setVehicles(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as VehicleRecord,
          ),
        ),
      ),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const eligibleDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.verified &&
          driver.authorizationStatus === "active" &&
          driver.associationId &&
          driver.vehicleId,
      ),
    [drivers],
  );

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.active),
    [vehicles],
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 text-[#043331]">
      <section className="rounded-[32px] bg-[#043331] p-7 text-white">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-amber-300">
          Regulated taxi operations · dispatcher
        </div>
        <h1 className="mt-3 text-4xl font-black">Fleet readiness review</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-white/70">
          Inspect reviewed associations, credentialed drivers, and active fleet capacity used by dispatch. Operator onboarding and credential attestation remain administrator-only.
        </p>
      </section>

      <section className="mt-6 rounded-[24px] border border-sky-200 bg-sky-50 p-5 text-sm font-semibold leading-6 text-sky-950">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Read-only dispatcher access.</strong> This view does not create associations, drivers, vehicles, or audit records. Use the Dispatch workspace to manage live trip operations.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Active associations"
          value={associations.filter((item) => item.status === "active").length}
        />
        <Metric label="Credentialed drivers" value={eligibleDrivers.length} />
        <Metric label="Active fleet vehicles" value={activeVehicles.length} />
      </section>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-teal-700">
            Reviewed operating network
          </div>
          <h2 className="mt-2 text-2xl font-black">Taxi associations</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {associations.map((association) => {
            const associationDrivers = drivers.filter(
              (driver) => driver.associationId === association.id,
            );
            const associationVehicles = vehicles.filter(
              (vehicle) => vehicle.associationId === association.id,
            );
            return (
              <article key={association.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{association.name}</h3>
                      <Status value={association.status} />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {association.islands.join(" · ").toUpperCase()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center sm:min-w-56">
                    <Datum label="Drivers" value={associationDrivers.length} />
                    <Datum label="Vehicles" value={associationVehicles.length} />
                  </div>
                </div>
              </article>
            );
          })}
          {!associations.length ? (
            <div className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
              No reviewed taxi associations are available.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Datum({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
        value === "active"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {value}
    </span>
  );
}
