import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ExternalLink } from "lucide-react";

import type { SavedMobilityTripRequest } from "../../services/mobilityTripRequests";

type Coord = {
  lat: number;
  lng: number;
};

function cleanMapboxToken() {
  const rawToken = String(
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
      import.meta.env.VITE_MAPBOX_TOKEN ||
      "",
  )
    .replace(/^["']|["']$/g, "")
    .trim();

  return rawToken.startsWith("pk.") ? rawToken : "";
}

function hasDriverLocation(request: SavedMobilityTripRequest) {
  return (
    typeof request.driverLat === "number" &&
    typeof request.driverLng === "number"
  );
}

function placeCoordinates(name?: string): Coord {
  const text = String(name ?? "").toLowerCase();

  if (text.includes("red hook")) {
    return { lat: 18.3269, lng: -64.8496 };
  }

  if (text.includes("sapphire")) {
    return { lat: 18.3347, lng: -64.8491 };
  }

  if (
    text.includes("cyril") ||
    text.includes("king") ||
    text.includes("airport")
  ) {
    return { lat: 18.3373, lng: -64.9734 };
  }

  if (text.includes("havensight")) {
    return { lat: 18.3357, lng: -64.9207 };
  }

  if (text.includes("cruz bay")) {
    return { lat: 18.3317, lng: -64.7944 };
  }

  if (text.includes("trunk")) {
    return { lat: 18.3548, lng: -64.7686 };
  }

  if (text.includes("christiansted")) {
    return { lat: 17.7466, lng: -64.7041 };
  }

  if (text.includes("frederiksted")) {
    return { lat: 17.7125, lng: -64.8821 };
  }

  return { lat: 18.3419, lng: -64.9307 };
}

function mapsUrl(request: SavedMobilityTripRequest) {
  if (!hasDriverLocation(request)) return "#";

  const lat = Number(request.driverLat);
  const lng = Number(request.driverLng);
  const label = encodeURIComponent(
    request.driverLocationLabel || "Driver location",
  );

  return `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
}

function markerElement(label: string, tone: "driver" | "pickup" | "dropoff") {
  const wrapper = document.createElement("div");

  const colors = {
    driver: {
      bg: "#047857",
      text: "#ffffff",
      dot: "#10b981",
    },
    pickup: {
      bg: "#020617",
      text: "#ffffff",
      dot: "#020617",
    },
    dropoff: {
      bg: "#facc15",
      text: "#020617",
      dot: "#f59e0b",
    },
  }[tone];

  wrapper.style.display = "grid";
  wrapper.style.placeItems = "center";
  wrapper.style.gap = "4px";
  wrapper.style.pointerEvents = "none";

  const pill = document.createElement("div");
  pill.textContent = label;
  pill.style.background = colors.bg;
  pill.style.color = colors.text;
  pill.style.fontWeight = "900";
  pill.style.fontSize = "11px";
  pill.style.letterSpacing = "0.02em";
  pill.style.borderRadius = "999px";
  pill.style.padding = "7px 10px";
  pill.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.2)";

  const dot = document.createElement("div");
  dot.style.width = tone === "driver" ? "22px" : "16px";
  dot.style.height = tone === "driver" ? "22px" : "16px";
  dot.style.borderRadius = "999px";
  dot.style.border = "4px solid white";
  dot.style.background = colors.dot;
  dot.style.boxShadow = "0 12px 24px rgba(15, 23, 42, 0.22)";

  wrapper.appendChild(pill);
  wrapper.appendChild(dot);

  return wrapper;
}

function makeFallbackRouteFeature(
  driver: Coord | null,
  pickup: Coord,
  dropoff: Coord,
): GeoJSON.Feature<GeoJSON.LineString> {
  const coordinates: [number, number][] = [];

  if (driver) {
    coordinates.push([driver.lng, driver.lat]);
  }

  coordinates.push([pickup.lng, pickup.lat]);
  coordinates.push([dropoff.lng, dropoff.lat]);

  return {
    type: "Feature",
    properties: {
      source: "fallback",
    },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

async function fetchRoadRouteFeature(args: {
  token: string;
  driver: Coord | null;
  pickup: Coord;
  dropoff: Coord;
}): Promise<GeoJSON.Feature<GeoJSON.LineString>> {
  const waypoints = [
    ...(args.driver ? [args.driver] : []),
    args.pickup,
    args.dropoff,
  ];

  const coordinates = waypoints
    .map((point) => `${point.lng},${point.lat}`)
    .join(";");

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}` +
    `?alternatives=false&geometries=geojson&overview=full&steps=false` +
    `&access_token=${encodeURIComponent(args.token)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mapbox route request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    routes?: Array<{
      geometry?: GeoJSON.LineString;
      distance?: number;
      duration?: number;
    }>;
  };

  const route = json.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    throw new Error("Mapbox did not return a road route.");
  }

  return {
    type: "Feature",
    properties: {
      source: "mapbox-directions",
      distance: route.distance ?? null,
      duration: route.duration ?? null,
    },
    geometry: route.geometry,
  };
}

export default function MobilityMapboxMiniMap({
  request,
}: {
  request: SavedMobilityTripRequest;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  const pickup = useMemo(
    () => placeCoordinates(request.pickupName),
    [request.pickupName],
  );

  const dropoff = useMemo(
    () => placeCoordinates(request.dropoffName),
    [request.dropoffName],
  );

  const driver = useMemo<Coord | null>(() => {
    if (!hasDriverLocation(request)) return null;

    return {
      lat: Number(request.driverLat),
      lng: Number(request.driverLng),
    };
  }, [request.driverLat, request.driverLng]);

  useEffect(() => {
    const token = cleanMapboxToken();

    if (!containerRef.current) return;

    if (!token) {
      setMapError("Mapbox token missing. Add VITE_MAPBOX_ACCESS_TOKEN.");
      return;
    }

    setMapError(null);

    mapboxgl.accessToken = token;

    const allPoints = [pickup, dropoff, ...(driver ? [driver] : [])];
    const centerLng =
      allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
    const centerLat =
      allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [centerLng, centerLat],
      zoom: 12,
      pitch: 64,
      bearing: -22,
      antialias: true,
      attributionControl: false,
      cooperativeGestures: true,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: false,
        visualizePitch: true,
      }),
      "top-right",
    );

    map.on("load", () => {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      map.setTerrain({
        source: "mapbox-dem",
        exaggeration: 1.45,
      });

      map.addSource("mobility-mini-route", {
        type: "geojson",
        data: makeFallbackRouteFeature(driver, pickup, dropoff),
      });

      map.addLayer({
        id: "mobility-mini-route-glow",
        type: "line",
        source: "mobility-mini-route",
        paint: {
          "line-color": "#022c22",
          "line-opacity": 0.28,
          "line-width": 10,
          "line-blur": 5,
        },
      });

      map.addLayer({
        id: "mobility-mini-route-line",
        type: "line",
        source: "mobility-mini-route",
        paint: {
          "line-color": "#10b981",
          "line-width": 5,
          "line-dasharray": [1.5, 0.8],
        },
      });

      fetchRoadRouteFeature({
        token,
        driver,
        pickup,
        dropoff,
      })
        .then((routeFeature) => {
          const routeSource = map.getSource(
            "mobility-mini-route",
          ) as mapboxgl.GeoJSONSource | undefined;

          routeSource?.setData(routeFeature);
        })
        .catch(() => {
          const routeSource = map.getSource(
            "mobility-mini-route",
          ) as mapboxgl.GeoJSONSource | undefined;

          routeSource?.setData(makeFallbackRouteFeature(driver, pickup, dropoff));
        });

      const bounds = new mapboxgl.LngLatBounds();

      allPoints.forEach((point) => {
        bounds.extend([point.lng, point.lat]);
      });

      map.fitBounds(bounds, {
        padding: 68,
        maxZoom: 13.7,
        pitch: 64,
        bearing: -22,
        duration: 900,
      });

      markersRef.current = [
        new mapboxgl.Marker({
          element: markerElement("Pickup", "pickup"),
          anchor: "bottom",
        })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(map),

        new mapboxgl.Marker({
          element: markerElement("Dropoff", "dropoff"),
          anchor: "bottom",
        })
          .setLngLat([dropoff.lng, dropoff.lat])
          .addTo(map),
      ];

      if (driver) {
        markersRef.current.push(
          new mapboxgl.Marker({
            element: markerElement("Driver", "driver"),
            anchor: "bottom",
          })
            .setLngLat([driver.lng, driver.lat])
            .addTo(map),
        );
      }
    });

    map.on("error", () => {
      setMapError("Mapbox could not load the mini tracking map.");
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [driver, dropoff, pickup, request.firestoreId]);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
            Mapbox 3D mini map
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-950">
            Live driver, pickup, and dropoff view
          </p>
        </div>

        {hasDriverLocation(request) ? (
          <a
            href={mapsUrl(request)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open map
          </a>
        ) : null}
      </div>

      <div className="relative h-[22rem] bg-slate-900">
        {mapError ? (
          <div className="absolute inset-0 grid place-items-center bg-emerald-50 p-6 text-center">
            <div>
              <p className="text-sm font-black text-emerald-950">
                {mapError}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                The rest of the tracking card still works.
              </p>
            </div>
          </div>
        ) : null}

        <div ref={containerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Driver location
          </p>
          <p className="mt-1 max-w-xs text-sm font-black text-slate-950">
            {request.driverLocationLabel || "Waiting for driver location"}
          </p>
        </div>
      </div>

      <div className="grid gap-2 border-t border-emerald-100 p-4 text-xs font-bold text-slate-600 sm:grid-cols-3">
        <div>
          <span className="block text-slate-400">Pickup</span>
          {request.pickupName || "Pickup"}
        </div>
        <div>
          <span className="block text-slate-400">Dropoff</span>
          {request.dropoffName || "Dropoff"}
        </div>
        <div>
          <span className="block text-slate-400">Driver</span>
          {request.driverLocationLabel || "Waiting for location"}
        </div>
      </div>
    </div>
  );
}
