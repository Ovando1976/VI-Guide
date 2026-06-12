import React, { useEffect, useMemo, useState } from "react";
import ItineraryRouteMap from "./ItineraryRouteMap";
import {
  ArrivalType,
  Interest,
  SavedPlanStop,
  TimeWindow,
  TripLength,
  VisitorMode,
  buildSmartItinerary,
} from "../lib/itineraryEngine";

const STORAGE_KEY = "viNavigatorDayPlan";

const modeOptions: { id: VisitorMode; label: string }[] = [
  { id: "cruise_day", label: "Cruise Day" },
  { id: "hotel_airline", label: "Hotel / Airline" },
];

const arrivalOptions: { id: ArrivalType; label: string }[] = [
  { id: "cruise", label: "Cruise Ship" },
  { id: "airport", label: "Airport" },
  { id: "ferry", label: "Ferry" },
  { id: "hotel", label: "Hotel / Villa" },
];

const timeOptions: { id: TimeWindow; label: string }[] = [
  { id: "4", label: "4 Hours" },
  { id: "6", label: "6 Hours" },
  { id: "8", label: "8 Hours" },
  { id: "full", label: "Full Day" },
];

const tripLengthOptions: { id: TripLength; label: string }[] = [
  { id: "day", label: "1 Day" },
  { id: "2_days", label: "2 Days" },
  { id: "3_days", label: "3 Days" },
  { id: "5_days", label: "5 Days" },
  { id: "week", label: "Week" },
];

const interestOptions: { id: Interest; label: string }[] = [
  { id: "beach", label: "Beach" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
  { id: "history", label: "History" },
  { id: "family", label: "Family" },
  { id: "snorkeling", label: "Snorkeling" },
];

function openDirections(stop: { coordinates?: { lat: number; lng: number } }) {
  if (!stop.coordinates) return;

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${stop.coordinates.lat},${stop.coordinates.lng}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function CruisePlanner() {
  const [mode, setMode] = useState<VisitorMode>("cruise_day");
  const [arrival, setArrival] = useState<ArrivalType>("cruise");
  const [time, setTime] = useState<TimeWindow>("6");
  const [tripLength, setTripLength] = useState<TripLength>("3_days");
  const [interests, setInterests] = useState<Interest[]>(["beach", "food"]);
  const [savedStops, setSavedStops] = useState<SavedPlanStop[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedStops(JSON.parse(saved));
    } catch (error) {
      console.warn("Could not load saved day plan", error);
    }
  }, []);

  useEffect(() => {
    if (mode === "cruise_day") {
      setArrival("cruise");
    } else {
      setArrival("airport");
    }
  }, [mode]);

  const plan = useMemo(
    () =>
      buildSmartItinerary({
        mode,
        arrival,
        time,
        tripLength,
        interests,
        savedStops,
      }),
    [mode, arrival, time, tripLength, interests, savedStops]
  );

  const toggleInterest = (id: Interest) => {
    setInterests((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const clearSavedPlan = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedStops([]);
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 pb-28">
      <section className="rounded-3xl bg-emerald-950 p-5 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
          VI Navigator
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {mode === "cruise_day"
            ? "Build your perfect cruise day."
            : "Plan your Virgin Islands stay."}
        </h1>

        <p className="mt-3 text-sm text-emerald-50">
          Smart visitor planning with stops, route maps, cost estimates, travel
          buffers, and return guidance.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
              Return
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {plan.safeReturnTime || "Flexible"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
              Days
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {plan.days.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
              Cost
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {plan.totalCostLabel}
            </p>
          </div>
        </div>

        {savedStops.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
              Saved From Map
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {savedStops.length} map stop
              {savedStops.length === 1 ? "" : "s"} added
            </p>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-stone-950">
          What kind of visitor are you?
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {modeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setMode(option.id)}
              className={`rounded-2xl px-4 py-4 text-sm font-bold shadow ${
                mode === option.id
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-stone-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-stone-950">
          Where are you arriving?
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {arrivalOptions
            .filter((option) =>
              mode === "cruise_day"
                ? option.id === "cruise" || option.id === "ferry"
                : option.id !== "cruise"
            )
            .map((option) => (
              <button
                key={option.id}
                onClick={() => setArrival(option.id)}
                className={`rounded-2xl px-4 py-4 text-sm font-bold shadow ${
                  arrival === option.id
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-stone-800"
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>
      </section>

      {mode === "cruise_day" ? (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-stone-950">
            How long do you have?
          </h2>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {timeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTime(option.id)}
                className={`rounded-2xl px-3 py-4 text-xs font-bold shadow ${
                  time === option.id
                    ? "bg-amber-300 text-stone-950"
                    : "bg-white text-stone-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-stone-950">
            How long are you staying?
          </h2>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {tripLengthOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTripLength(option.id)}
                className={`rounded-2xl px-2 py-4 text-[11px] font-bold shadow ${
                  tripLength === option.id
                    ? "bg-amber-300 text-stone-950"
                    : "bg-white text-stone-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-stone-950">
          What do you want to do?
        </h2>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {interestOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleInterest(option.id)}
              className={`rounded-2xl px-3 py-4 text-xs font-bold shadow ${
                interests.includes(option.id)
                  ? "bg-sky-900 text-white"
                  : "bg-white text-stone-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-6">
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
            Route Preview
          </p>

          <h2 className="mt-2 text-2xl font-bold text-stone-950">
            Map of Your First Day
          </h2>

          <div className="mt-5">
            <ItineraryRouteMap routeCoordinates={plan.routeCoordinates} />
          </div>
        </div>

        {plan.days.map((day) => (
          <div key={day.id} className="rounded-3xl bg-white p-5 shadow-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
              {day.subtitle}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-stone-950">
              {day.title}
            </h2>

            <div className="mt-5 space-y-4">
              {day.items.map((item, index) => (
                <div
                  key={`${day.id}-${item.id}-${index}`}
                  className="rounded-3xl bg-stone-100 p-4"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                            {item.time} • {item.type}
                          </p>

                          <h3 className="mt-1 text-lg font-black text-stone-950">
                            {item.title}
                          </h3>
                        </div>

                        {item.coordinates && (
                          <button
                            onClick={() => openDirections(item)}
                            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-stone-800 shadow"
                          >
                            Map
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-stone-600">
                        {item.description}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-white p-2 text-center">
                          <p className="text-[9px] font-bold uppercase text-stone-400">
                            Stay
                          </p>
                          <p className="text-xs font-black">{item.duration}</p>
                        </div>

                        <div className="rounded-xl bg-white p-2 text-center">
                          <p className="text-[9px] font-bold uppercase text-stone-400">
                            Drive
                          </p>
                          <p className="text-xs font-black">
                            {item.travelTime}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-2 text-center">
                          <p className="text-[9px] font-bold uppercase text-stone-400">
                            Cost
                          </p>
                          <p className="text-xs font-black">{item.cost}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-bold text-white">
            Save My Plan
          </button>

          <button
            onClick={clearSavedPlan}
            className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-bold text-stone-800"
          >
            Clear Plan
          </button>
        </div>
      </section>
    </main>
  );
}