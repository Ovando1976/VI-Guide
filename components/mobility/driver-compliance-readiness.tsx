"use client";

import { doc, onSnapshot } from "firebase/firestore";
import {
  AlertTriangle,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";
import type { DriverProfile, VehicleRecord } from "@/types/driver";

type DriverRecord = DriverProfile & {
  displayName?: string;
  idHint?: string;
};

type CheckItem = {
  label: string;
  detail: string;
  ready: boolean;
};

function isFutureDate(value?: string | null) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function formatDate(value?: string | null) {
  if (!value) return "Missing";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function DriverComplianceReadiness({ driverId }: { driverId: string }) {
  const [driver, setDriver] = useState<DriverRecord | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "drivers", driverId),
      (snapshot) => {
        setDriver(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as DriverRecord)
            : null,
        );
        setErrorMessage(
          snapshot.exists()
            ? null
            : "No fleet driver profile is linked to this account.",
        );
        setLoading(false);
      },
      (error) => {
        console.error("driver compliance profile listener error", error);
        setErrorMessage(error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [driverId]);

  useEffect(() => {
    setVehicle(null);
    if (!driver?.vehicleId) return;

    return onSnapshot(
      doc(db, "vehicles", driver.vehicleId),
      (snapshot) => {
        setVehicle(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as VehicleRecord)
            : null,
        );
      },
      (error) => {
        console.error("driver compliance vehicle listener error", error);
        setErrorMessage(error.message);
      },
    );
  }, [driver?.vehicleId]);

  const checks = useMemo<CheckItem[]>(
    () => [
      {
        label: "Driver authorization",
        detail:
          driver?.verified && driver.authorizationStatus === "active"
            ? "Verified and actively authorized"
            : `Status: ${driver?.authorizationStatus ?? "not configured"}`,
        ready: Boolean(driver?.verified && driver.authorizationStatus === "active"),
      },
      {
        label: "Taxicab Commission badge",
        detail: driver?.taxiCommissionBadgeNumber
          ? `${driver.taxiCommissionBadgeNumber} · expires ${formatDate(
              driver.taxiCommissionBadgeExpiresAt,
            )}`
          : "Badge number or expiration missing",
        ready: Boolean(
          driver?.taxiCommissionBadgeNumber &&
            isFutureDate(driver.taxiCommissionBadgeExpiresAt),
        ),
      },
      {
        label: "Driver license",
        detail: driver?.licenseClass
          ? `Class ${driver.licenseClass} · expires ${formatDate(
              driver.licenseExpiresAt,
            )}`
          : "License class or expiration missing",
        ready: Boolean(
          driver?.licenseClass && isFutureDate(driver.licenseExpiresAt),
        ),
      },
      {
        label: "Taxi association",
        detail: driver?.associationId
          ? `Association ${driver.associationId}`
          : "No active association linked",
        ready: Boolean(driver?.associationId),
      },
      {
        label: "Fleet vehicle",
        detail: vehicle
          ? `${vehicle.make} ${vehicle.model} · ${vehicle.taxiPlate ?? "taxi plate missing"}`
          : driver?.vehicleId
            ? "Linked vehicle record unavailable"
            : "No fleet vehicle linked",
        ready: Boolean(
          vehicle?.active &&
            vehicle.driverId === driver?.id &&
            vehicle.associationId === driver?.associationId &&
            vehicle.taxiPlate &&
            vehicle.medallionNumber,
        ),
      },
      {
        label: "Vehicle inspection",
        detail: vehicle
          ? `${vehicle.inspectionStatus ?? "not configured"} · expires ${formatDate(
              vehicle.inspectionExpiresAt,
            )}`
          : "Vehicle required",
        ready: Boolean(
          vehicle?.inspectionStatus === "active" &&
            isFutureDate(vehicle.inspectionExpiresAt),
        ),
      },
      {
        label: "Vehicle insurance",
        detail: vehicle
          ? `${vehicle.insuranceStatus ?? "not configured"} · expires ${formatDate(
              vehicle.insuranceExpiresAt,
            )}`
          : "Vehicle required",
        ready: Boolean(
          vehicle?.insuranceStatus === "active" &&
            isFutureDate(vehicle.insuranceExpiresAt),
        ),
      },
    ],
    [driver, vehicle],
  );

  const readyCount = checks.filter((item) => item.ready).length;
  const dispatchReady = readyCount === checks.length;

  if (loading) {
    return (
      <section className="mb-5 h-40 animate-pulse rounded-[28px] border border-slate-200 bg-white" />
    );
  }

  return (
    <section
      className={`mb-5 overflow-hidden rounded-[28px] border shadow-sm ${
        dispatchReady
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
              dispatchReady
                ? "bg-emerald-600 text-white"
                : "bg-amber-400 text-[#043331]"
            }`}
          >
            {dispatchReady ? (
              <BadgeCheck className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </span>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">
              Commission and fleet gate
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-[#043331]">
              {dispatchReady
                ? "Authorized for verified dispatch"
                : "Dispatch access is restricted"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              {dispatchReady
                ? "Your required driver, association, vehicle, inspection, and insurance records are current."
                : "Every required credential must be present and unexpired before a paid ride can be accepted."}
            </p>
          </div>
        </div>
        <span
          className={`w-fit rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.16em] ${
            dispatchReady
              ? "bg-emerald-600 text-white"
              : "bg-amber-200 text-amber-950"
          }`}
        >
          {readyCount} of {checks.length} ready
        </span>
      </div>

      {errorMessage ? (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-white p-4 text-sm font-semibold text-rose-700 sm:mx-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        {checks.map((item, index) => {
          const Icon =
            index === 4
              ? CarFront
              : index > 4
                ? FileCheck2
                : item.ready
                  ? CheckCircle2
                  : AlertTriangle;
          return (
            <div
              key={item.label}
              className="rounded-[22px] border border-black/5 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    item.ready
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-black text-[#043331]">
                    {item.label}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                    {item.detail}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
