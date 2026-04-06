import React from 'react';
import { ExplorerCard } from "./ExplorerCard";
import type { EventDoc } from "../../types";

export function EventCard({ event, onClick }: { event: EventDoc; onClick?: (event: EventDoc) => void }) {
  return (
    <ExplorerCard
      onClick={() => onClick?.(event)}
      title={event.title}
      subtitle={event.shortDescription || event.description}
      image={event.coverImage}
      badge="Event"
    />
  );
}
