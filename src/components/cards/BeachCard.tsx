import React from 'react';
import { ExplorerCard } from "./ExplorerCard";
import type { BeachDoc } from "../../types";

export function BeachCard({ beach, onClick }: { beach: BeachDoc; onClick?: (beach: BeachDoc) => void }) {
  return (
    <ExplorerCard
      onClick={() => onClick?.(beach)}
      title={beach.title}
      subtitle={beach.shortDescription || beach.description}
      image={beach.coverImage}
      badge="Beach"
    />
  );
}
