"use client";

import { useMemo, useState } from "react";

import Node from "./Node";
import type {
  ArchitectureGraph,
  GraphNode,
} from "./types";

interface Props {
  graph: ArchitectureGraph;
}

export default function Graph({
  graph,
}: Props) {
  const [selected, setSelected] =
    useState<GraphNode>();

  const incoming = useMemo(() => {
    if (!selected) return [];

    return graph.edges.filter(
      (e) => e.target === selected.id,
    );
  }, [graph, selected]);

  const outgoing = useMemo(() => {
    if (!selected) return [];

    return graph.edges.filter(
      (e) => e.source === selected.id,
    );
  }, [graph, selected]);

  return (
    <div className="grid h-full grid-cols-[350px_1fr]">
      <aside className="overflow-y-auto border-r p-4">
        <h2 className="mb-4 font-semibold">
          Modules
        </h2>

        <div className="space-y-2">
          {graph.nodes
            .slice()
            .sort((a, b) =>
              a.id.localeCompare(b.id),
            )
            .map((node) => (
              <Node
                key={node.id}
                node={node}
                active={
                  selected?.id === node.id
                }
                onClick={() =>
                  setSelected(node)
                }
              />
            ))}
        </div>
      </aside>

      <section className="overflow-auto p-6">
        {!selected && (
          <p className="text-muted-foreground">
            Select a module.
          </p>
        )}

        {selected && (
          <>
            <h2 className="text-xl font-bold">
              {selected.id}
            </h2>

            <div className="mt-6 space-y-2">
              <div>
                <strong>Role:</strong>{" "}
                {selected.role}
              </div>

              <div>
                <strong>Lines:</strong>{" "}
                {selected.lines}
              </div>

              <div>
                <strong>Imports:</strong>{" "}
                {outgoing.length}
              </div>

              <div>
                <strong>Imported By:</strong>{" "}
                {incoming.length}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold">
                Outgoing Dependencies
              </h3>

              <ul className="mt-2 list-disc pl-5">
                {outgoing.map((edge) => (
                  <li key={edge.target}>
                    {edge.target}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold">
                Incoming Dependencies
              </h3>

              <ul className="mt-2 list-disc pl-5">
                {incoming.map((edge) => (
                  <li key={edge.source}>
                    {edge.source}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}