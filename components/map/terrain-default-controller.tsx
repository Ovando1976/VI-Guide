"use client";

import { useEffect } from "react";

const OPEN_TOPO_PATTERN =
  /https:\/\/(?:[a-z]\.)?tile\.opentopomap\.org\/(\d+)\/(\d+)\/(\d+)\.png(?:\?.*)?$/i;
const ESRI_TOPO_PREFIX =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile";

function rewriteTerrainTile(image: HTMLImageElement) {
  const source = image.currentSrc || image.src;
  const match = source.match(OPEN_TOPO_PATTERN);
  if (!match) return false;

  const [, zoom, x, y] = match;
  const replacement = `${ESRI_TOPO_PREFIX}/${zoom}/${y}/${x}`;

  if (image.src !== replacement) {
    image.dataset.viTerrainTile = "esri";
    image.src = replacement;
  }

  return true;
}

function rewriteVisibleTerrainTiles() {
  document
    .querySelectorAll<HTMLImageElement>("img.leaflet-tile")
    .forEach(rewriteTerrainTile);

  document.querySelectorAll<HTMLElement>(".leaflet-control-attribution").forEach((node) => {
    if (/OpenTopoMap/i.test(node.textContent || "")) {
      node.innerHTML =
        '<a href="https://www.esri.com/" target="_blank" rel="noreferrer">Terrain © Esri</a> · Map data © OpenStreetMap contributors';
    }
  });
}

function selectTerrainMode() {
  const terrainButton = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find((button) => button.textContent?.trim().toLowerCase() === "terrain");

  if (!terrainButton) return false;
  if (terrainButton.getAttribute("aria-pressed") === "true") return true;

  terrainButton.click();
  return true;
}

export function TerrainDefaultController() {
  useEffect(() => {
    let attempts = 0;
    const selectTimer = window.setInterval(() => {
      attempts += 1;
      selectTerrainMode();
      rewriteVisibleTerrainTiles();

      if (attempts >= 40) window.clearInterval(selectTimer);
    }, 125);

    const maintenanceTimer = window.setInterval(rewriteVisibleTerrainTiles, 900);

    const observer = new MutationObserver(() => rewriteVisibleTerrainTiles());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    const handleTileEvent = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        rewriteTerrainTile(event.target);
      }
    };

    document.addEventListener("load", handleTileEvent, true);
    document.addEventListener("error", handleTileEvent, true);
    rewriteVisibleTerrainTiles();

    return () => {
      window.clearInterval(selectTimer);
      window.clearInterval(maintenanceTimer);
      observer.disconnect();
      document.removeEventListener("load", handleTileEvent, true);
      document.removeEventListener("error", handleTileEvent, true);
    };
  }, []);

  return null;
}
