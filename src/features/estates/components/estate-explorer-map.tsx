import React, { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { IslandCode } from '../../../types';
import type { ParcelIslandCode, ParcelRecord } from '../../geography/types';
import { filterParcelsByEstate, filterParcelsByIsland } from '../../geography/lib/parcel-filters';
import { useParcelSearch } from '../../geography/hooks/useParcelSearch';
import { useParcelSelection } from '../../geography/hooks/useParcelSelection';
import { ParcelSearchBox } from '../../geography/components/ParcelSearchBox';
import { ParcelDetailCard } from '../../geography/components/ParcelDetailCard';
import { ParcelMapLegend } from '../../geography/components/ParcelMapLegend';

import estatesDatasetUrl from '../../../../generated/usvi-estates.json?url';
import parcelsDatasetUrl from '../../../data/usvi-parcels.index.json?url';
import parcelsGeojsonUrl from '../../../data/usvi-parcels.geojson?url';

const DEFAULT_CENTER: Record<IslandCode, [number, number]> = {
  st_thomas: [18.34, -64.92],
  st_john: [18.34, -64.74],
  st_croix: [17.74, -64.75],
  water_island: [18.32, -64.95],
};

export function EstateExplorerMap({
  selectedIsland,
  onUseParcelForRoute,
  onAskConcierge,
}: {
  selectedIsland: IslandCode;
  onUseParcelForRoute?: (parcel: ParcelRecord) => void;
  onAskConcierge?: (parcel: ParcelRecord) => void;
}) {
  const [estatesGeo, setEstatesGeo] = useState<any | null>(null);
  const [parcelsGeo, setParcelsGeo] = useState<any | null>(null);
  const [parcelRecords, setParcelRecords] = useState<ParcelRecord[]>([]);
  const [selectedEstateGeoid, setSelectedEstateGeoid] = useState<string | null>(null);
  const [zoom, setZoom] = useState(11);
  const parcelIsland = mapIslandCode(selectedIsland);

  const scopedByIsland = useMemo(
    () => filterParcelsByIsland(parcelRecords, parcelIsland),
    [parcelRecords, parcelIsland]
  );
  const visibleParcels = useMemo(
    () => filterParcelsByEstate(scopedByIsland, selectedEstateGeoid),
    [scopedByIsland, selectedEstateGeoid]
  );

  const { query, setQuery, results } = useParcelSearch(visibleParcels, parcelIsland);
  const { selectedParcel, selectParcel } = useParcelSelection();
  const showParcels = zoom >= 13 || Boolean(selectedEstateGeoid);

  useEffect(() => {
    async function load() {
      const [estatesResponse, parcelsResponse, parcelsGeoResponse] = await Promise.all([
        fetch(estatesDatasetUrl),
        fetch(parcelsDatasetUrl),
        fetch(parcelsGeojsonUrl),
      ]);
      const estatesRows = await estatesResponse.json();
      const parcelsRows = await parcelsResponse.json();
      const parcelsGeoData = await parcelsGeoResponse.json();

      const features = estatesRows.map((estate: any) => ({
        type: 'Feature',
        properties: {
          geoid: estate.geoid,
          name: estate.name,
          island: estate.island,
        },
        geometry: estate.geometry,
      }));
      setEstatesGeo({ type: 'FeatureCollection', features });
      setParcelRecords(parcelsRows);
      setParcelsGeo(parcelsGeoData);
    }

    load().catch((error) => console.error('Failed to load estate/parcel map data', error));
  }, []);

  const parcelGeoForMap = useMemo(() => {
    if (!parcelsGeo) return null;
    const allowedIds = new Set(visibleParcels.map((record) => record.parcelId));
    return {
      ...parcelsGeo,
      features: parcelsGeo.features.filter((feature: any) =>
        allowedIds.has(feature.properties?.parcelId)
      ),
    };
  }, [parcelsGeo, visibleParcels]);

  return (
    <div className="space-y-3">
      <ParcelSearchBox query={query} onQueryChange={setQuery} results={results} onSelect={selectParcel} />
      <div className="relative rounded-2xl overflow-hidden border border-stone-200">
        <MapContainer
          center={DEFAULT_CENTER[selectedIsland]}
          zoom={11}
          className="h-80 w-full"
          scrollWheelZoom
        >
          <MapZoomObserver onZoomChange={setZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {estatesGeo && (
            <GeoJSON
              data={estatesGeo as any}
              style={(feature: any) => ({
                color: feature?.properties?.geoid === selectedEstateGeoid ? '#0f766e' : '#334155',
                weight: feature?.properties?.geoid === selectedEstateGeoid ? 2 : 1,
                fillOpacity: feature?.properties?.island === parcelIsland ? 0.14 : 0.04,
                fillColor: '#06b6d4',
              })}
              onEachFeature={(feature: any, layer) => {
                layer.on('click', () => {
                  setSelectedEstateGeoid(feature?.properties?.geoid ?? null);
                });
              }}
            />
          )}

          {showParcels && parcelGeoForMap && (
            <GeoJSON
              data={parcelGeoForMap as any}
              style={(feature: any) => ({
                color: selectedParcel?.parcelId === feature?.properties?.parcelId ? '#fb7185' : '#f97316',
                weight: selectedParcel?.parcelId === feature?.properties?.parcelId ? 2.4 : 1.2,
                fillColor: '#fdba74',
                fillOpacity: selectedParcel?.parcelId === feature?.properties?.parcelId ? 0.4 : 0.2,
              })}
              onEachFeature={(feature: any, layer) => {
                layer.on('click', () => {
                  const match = visibleParcels.find((parcel) => parcel.parcelId === feature?.properties?.parcelId);
                  if (match) selectParcel(match);
                });
              }}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-3 left-3">
          <ParcelMapLegend parcelVisible={showParcels} />
        </div>
      </div>

      <ParcelDetailCard
        parcel={selectedParcel}
        onUseForRoute={(parcel) => {
          const match = visibleParcels.find((record) => record.parcelId === parcel.parcelId);
          if (match) onUseParcelForRoute?.(match);
        }}
        onAskConcierge={(parcel) => {
          const match = visibleParcels.find((record) => record.parcelId === parcel.parcelId);
          if (match) onAskConcierge?.(match);
        }}
      />
    </div>
  );
}

function MapZoomObserver({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend(event) {
      onZoomChange(event.target.getZoom());
    },
  });
  return null;
}

function mapIslandCode(code: IslandCode): ParcelIslandCode {
  switch (code) {
    case 'st_thomas':
      return 'stt';
    case 'st_john':
      return 'stj';
    case 'st_croix':
      return 'stx';
    case 'water_island':
      return 'wat';
    default:
      return 'unk';
  }
}
