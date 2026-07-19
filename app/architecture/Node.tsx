"use client";

import clsx from "clsx";

import type { GraphNode } from "./types";

interface Props {
  node: GraphNode;
  active: boolean;
  onClick(): void;
}

export default function Node({
  node,
  active,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full rounded border p-3 text-left transition",
        active
          ? "border-blue-500 bg-blue-50"
          : "hover:bg-muted",
      )}
    >
      <div className="font-medium">
        {node.id}
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        {node.role} • {node.lines} lines
      </div>
    </button>
  );
}