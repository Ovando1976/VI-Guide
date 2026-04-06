import React from 'react';
import { ExplorerCard } from "./ExplorerCard";
import type { PlaceDoc } from "../../types";

export function PlaceCard({ place, onClick }: { place: PlaceDoc; onClick?: (place: PlaceDoc) => void }) {
  return (
    <ExplorerCard
      onClick={() => onClick?.(place)}
      title={place.title}
      subtitle={place.shortDescription || place.description}
      image={place.coverImage}
      badge={place.category}
    />
  );
}
