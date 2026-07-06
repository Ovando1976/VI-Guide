import { useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

import {
  ensureDefaultMobilityDrivers,
  saveMobilityDriverProfile,
  subscribeMobilityDrivers,
  updateMobilityDriverProfile,
  type MobilityDriverIsland,
  type MobilityDriverProfile,
  type MobilityDriverStatus,
} from "../../services/mobilityDrivers";

const ISLAND_OPTIONS: Array<{
  value: MobilityDriverIsland;
  label: string;
}> = [
  { value: "st_thomas", label: "St. Thomas" },
  { value: "st_john", label: "St. John" },
  { value: "st_croix", label: "St. Croix" },
  { value: "water_island", label: "Water Island" },
  { value: "territory", label: "Territory-wide" },
];

const STATUS_OPTIONS: Array<{
  value: MobilityDriverStatus;
  label: string;
}> = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

type DriverFormState = {
  driverName: string;
  island: MobilityDriverIsland;
  vehicleLabel: string;
  phone: string;
  status: MobilityDriverStatus;
  active: boolean;
};

const EMPTY_FORM: DriverFormState = {
  driverName: "",
  island: "st_thomas",
  vehicleLabel: "",
  phone: "",
  status: "available",
  active: true,
};

function islandLabel(value: MobilityDriverIsland) {
  return (
    ISLAND_OPTIONS.find((option) => option.value === value)?.label ||
    "Territory-wide"
  );
}

function statusClasses(status: MobilityDriverStatus) {
  if (status === "available") {
    return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  }

  if (status === "busy") {
    return "bg-amber-100 text-amber-900 ring-amber-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function formFromDriver(driver: MobilityDriverProfile): DriverFormState {
  return {
    driverName: driver.driverName || driver.name,
    island: driver.island,
    vehicleLabel: driver.vehicleLabel,
    phone: driver.phone || "",
    status: driver.status,
    active: driver.active,
  };
}

export default function MobilityDriverManagementPanel() {
  const [drivers, setDrivers] = useState<MobilityDriverProfile[]>([]);
  const [form, setForm] = useState<DriverFormState>(EMPTY_FORM);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DriverFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeMobilityDrivers({
      onData: setDrivers,
      onError: (nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Could not load drivers.",
        );
      },
    });
  }, []);

  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.active),
    [drivers],
  );

  const disabledDrivers = useMemo(
    () => drivers.filter((driver) => !driver.active),
    [drivers],
  );

  async function handleCreateDriver() {
    if (!form.driverName.trim() || !form.vehicleLabel.trim()) {
      setError("Driver name and vehicle are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveMobilityDriverProfile({
        driverName: form.driverName,
        island: form.island,
        vehicleLabel: form.vehicleLabel,
        phone: form.phone,
        status: form.status,
        active: form.active,
      });

      setForm(EMPTY_FORM);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not save driver.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(driverId: string) {
    if (!editForm.driverName.trim() || !editForm.vehicleLabel.trim()) {
      setError("Driver name and vehicle are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateMobilityDriverProfile(driverId, {
        driverName: editForm.driverName,
        island: editForm.island,
        vehicleLabel: editForm.vehicleLabel,
        phone: editForm.phone,
        status: editForm.status,
        active: editForm.active,
      });

      setEditingDriverId(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update driver.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickUpdate(
    driver: MobilityDriverProfile,
    updates: Partial<DriverFormState>,
  ) {
    setSaving(true);
    setError(null);

    try {
      await updateMobilityDriverProfile(driver.driverId, updates);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update driver.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedDefaults() {
    setSeeding(true);
    setError(null);

    try {
      await ensureDefaultMobilityDrivers();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not seed default drivers.",
      );
    } finally {
      setSeeding(false);
    }
  }

  return (
    <section className="mx-auto my-8 max-w-7xl rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
            <UserRound className="h-4 w-4" />
            Driver Management
          </span>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Mobility drivers.
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Add drivers, update vehicles, set driver availability, and disable
            drivers without deleting trip history.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 p-3 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Total
            </p>
            <p className="text-2xl font-black text-emerald-950">
              {drivers.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Active
            </p>
            <p className="text-2xl font-black text-emerald-950">
              {activeDrivers.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Disabled
            </p>
            <p className="text-2xl font-black text-emerald-950">
              {disabledDrivers.length}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Add driver
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-6">
          <input
            value={form.driverName}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                driverName: event.target.value,
              }))
            }
            placeholder="Driver name"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 lg:col-span-2"
          />

          <input
            value={form.vehicleLabel}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                vehicleLabel: event.target.value,
              }))
            }
            placeholder="Vehicle label"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 lg:col-span-2"
          />

          <select
            value={form.island}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                island: event.target.value as MobilityDriverIsland,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
          >
            {ISLAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={form.status}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                status: event.target.value as MobilityDriverStatus,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={form.phone}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                phone: event.target.value,
              }))
            }
            placeholder="Phone optional"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 lg:col-span-2"
          />

          <button
            type="button"
            onClick={handleCreateDriver}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Saving..." : "Add driver"}
          </button>

          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
          >
            <RefreshCw className="h-4 w-4" />
            {seeding ? "Seeding..." : "Seed defaults"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {drivers.map((driver) => {
          const isEditing = editingDriverId === driver.driverId;
          const currentForm = isEditing ? editForm : formFromDriver(driver);

          return (
            <article
              key={driver.driverId}
              className={`rounded-3xl border p-4 shadow-sm ${
                driver.active
                  ? "border-emerald-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-75"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ring-1 ${statusClasses(
                        driver.status,
                      )}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {driver.status}
                    </span>

                    {!driver.active ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                        Disabled
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    {driver.driverName || driver.name}
                  </h3>

                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Car className="h-4 w-4" />
                    {driver.vehicleLabel} · {islandLabel(driver.island)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingDriverId(isEditing ? null : driver.driverId);
                    setEditForm(formFromDriver(driver));
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                >
                  <Pencil className="h-4 w-4" />
                  {isEditing ? "Close" : "Edit"}
                </button>
              </div>

              {isEditing ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    value={currentForm.driverName}
                    onChange={(event) =>
                      setEditForm((value) => ({
                        ...value,
                        driverName: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                  />

                  <input
                    value={currentForm.vehicleLabel}
                    onChange={(event) =>
                      setEditForm((value) => ({
                        ...value,
                        vehicleLabel: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                  />

                  <select
                    value={currentForm.island}
                    onChange={(event) =>
                      setEditForm((value) => ({
                        ...value,
                        island: event.target.value as MobilityDriverIsland,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                  >
                    {ISLAND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentForm.status}
                    onChange={(event) =>
                      setEditForm((value) => ({
                        ...value,
                        status: event.target.value as MobilityDriverStatus,
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={currentForm.phone}
                    onChange={(event) =>
                      setEditForm((value) => ({
                        ...value,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Phone optional"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 md:col-span-2"
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveEdit(driver.driverId)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    Save changes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickUpdate(driver, {
                        active: !driver.active,
                      })
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Power className="h-4 w-4" />
                    {driver.active ? "Disable driver" : "Enable driver"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleQuickUpdate(driver, {
                          status: option.value,
                        })
                      }
                      disabled={saving}
                      className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                        driver.status === option.value
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickUpdate(driver, {
                        active: !driver.active,
                      })
                    }
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white"
                  >
                    {driver.active ? "Disable" : "Enable"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
