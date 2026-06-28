import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";

export type GaussianSplatLayer = {
  id: string;
  url: string;
  bbox: [number, number, number, number];
};

type Props = {
  map: mapboxgl.Map | null;
  layers: GaussianSplatLayer[];
  opacity?: number;
};

export function GaussianSplatOverlay({ map, layers, opacity = 0.35 }: Props) {
  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const addLayers = () => {
      if (cancelled) return;

      try {
        if (!map.isStyleLoaded()) return;

        for (const layer of layers) {
          const sourceId = `${layer.id}-source`;
          const [west, south, east, north] = layer.bbox;

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "image",
              url: layer.url,
              coordinates: [
                [west, north],
                [east, north],
                [east, south],
                [west, south],
              ],
            });
          }

          if (!map.getLayer(layer.id)) {
            map.addLayer(
              {
                id: layer.id,
                type: "raster",
                source: sourceId,
                paint: {
                  "raster-opacity": opacity,
                  "raster-fade-duration": 200,
                },
              },
              map.getLayer("estates-quarter-fill") ? "estates-quarter-fill" : undefined
            );
          } else {
            map.setPaintProperty(layer.id, "raster-opacity", opacity);
          }
        }
      } catch (error) {
        console.warn("Gaussian splat overlay failed:", error);
      }
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once("load", addLayers);
    }

    return () => {
      cancelled = true;
    };
  }, [map, layers, opacity]);

  return null;
}