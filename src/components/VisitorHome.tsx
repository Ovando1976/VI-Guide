import React from "react";
import { useNavigate } from "react-router-dom";
import { FeaturedSection } from "./FeaturedSection";
import Explore from "./Explore";
import { BeachDoc, PlaceDoc, IslandCode } from "../types";

type VisitorHomeProps = {
  selectedIsland: IslandCode;
  initialSearchQuery: string;
  onSelectListing: (listing: BeachDoc | PlaceDoc | null) => void;
};

export default function VisitorHome({
  selectedIsland,
  initialSearchQuery,
  onSelectListing,
}: VisitorHomeProps) {
  const navigate = useNavigate();

  return (
    <>
      <section className="px-4 pt-6">
        <div className="rounded-3xl bg-emerald-950 p-5 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            VI Navigator Alpha
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            The digital gateway to the Virgin Islands.
          </h1>

          <p className="mt-3 text-sm text-emerald-50">
            Build your perfect island day with beaches, food, history, events,
            transport, and local discovery in one place.
          </p>

          <button
            onClick={() => navigate("/cruise")}
            className="mt-5 w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-stone-950"
          >
            Plan My Day
          </button>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/beaches")}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950"
            >
              Beaches
            </button>

            <button
              onClick={() => navigate("/events")}
              className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"
            >
              Events
            </button>

            <button
              onClick={() => navigate("/history")}
              className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"
            >
              History
            </button>

            <button
              onClick={() => navigate("/map")}
              className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"
            >
              Live Map
            </button>
          </div>
        </div>
      </section>

      <div className="mt-12" id="explore">
        <FeaturedSection
          selectedIsland={selectedIsland}
          onSelectListing={onSelectListing}
        />

        <Explore
          selectedIsland={selectedIsland}
          initialSearchQuery={initialSearchQuery}
          onSelectListing={onSelectListing}
        />
      </div>
    </>
  );
}
