"use client";

import { useEffect } from "react";

const OPEN_TOPO_PATTERN = /https:\/\/[^/]+\.tile\.opentopomap\.org\/(\d+)\/(\d+)\/(\d+)\.png/;

function replaceTerrainTileSource(image: HTMLImageElement) {
  const match = image.src.match(OPEN_TOPO_PATTERN);
  if (!match) return;

  const [, zoom, x, y] = match;
  image.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${y}/${x}`;
}

function selectTerrainMode() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const terrainButton = buttons.find(
    (button) => button.textContent?.trim().toLowerCase() === "terrain",
  );

  if (!terrainButton) return false;
  terrainButton.click();
  return true;
}

export function TerrainDefaultController() {
  useEffect(() => {
    let attempts = 0;
    const selectTimer = window.setInterval(() => {
      attempts += 1;
      if (selectTerrainMode() || attempts >= 30) {
        window.clearInterval(selectTimer);
      }
    }, 150);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLImageElement) {
            replaceTerrainTileSource(node);
            continue;
          }

          if (node instanceof HTMLElement) {
            node
              .querySelectorAll<HTMLImageElement>("img.leaflet-tile")
              .forEach(replaceTerrainTileSource);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    document
      .querySelectorAll<HTMLImageElement>("img.leaflet-tile")
      .forEach(replaceTerrainTileSource);

    return () => {
      window.clearInterval(selectTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}
