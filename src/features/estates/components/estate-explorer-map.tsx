import React, { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { GeoJSON, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { IslandCode } from '../../../types';
import type { GeographyIslandCode, ParcelFeatureProperties, ParcelIslandCode, ParcelRecord, SelectedParcel } from '../../geography/types';
import { useParcelSearch } from '../../geography/hooks/useParcelSearch';
import { useParcelSelection } from '../../geography/hooks/useParcelSelection';
import { ParcelSearchBox } from '../../geography/components/ParcelSearchBox';
import { ParcelDetailCard } from '../../geography/components/ParcelDetailCard';
import { ParcelMapLegend } from '../../geography/components/ParcelMapLegend';
import { matchesParcelFilter } from '../../geography/lib/parcel-map-filters';

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
  selectedEstateGeoid: selectedEstateGeoidProp,
  onSelectEstate,
  onSelectParcel,
  onUseParcelForRoute,
  onAskConcierge,
}: {
  selectedIsland: IslandCode | "all" | GeographyIslandCode;
  selectedEstateGeoid?: string | null;
  onSelectEstate?: (estateGeoid: string | null) => void;
  onSelectParcel?: (parcel: SelectedParcel) => void;
  onUseParcelForRoute?: (parcel: ParcelRecord) => void;
  onAskConcierge?: (parcel: ParcelRecord) => void;
}) {
  const [estatesGeo, setEstatesGeo] = useState<any | null>(null);
  const [parcelsGeo, setParcelsGeo] = useState<any | null>(null);
  const [parcelRecords, setParcelRecords] = useState<ParcelRecord[]>([]);
  const [selectedEstateGeoid, setSelectedEstateGeoid] = useState<string | null>(selectedEstateGeoidProp ?? null);
  const [zoom, setZoom] = useState(11);
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  const parcelIsland = mapIslandCode(selectedIsland);

  useEffect(() => {
    setSelectedEstateGeoid(selectedEstateGeoidProp ?? null);
  }, [selectedEstateGeoidProp]);

  const visibleParcels = useMemo(
    () => parcelRecords.filter((record) => matchesParcelFilter(record, { island: parcelIsland, estateGeoid: selectedEstateGeoid ?? null })),
    [parcelRecords, parcelIsland, selectedEstateGeoid]
  );

  const { query, setQuery, results } = useParcelSearch(visibleParcels, parcelIsland === 'all' ? 'all' : parcelIsland);
  const { selectedParcel, selectParcel, setSelectedParcel } = useParcelSelection();
  const showParcels = zoom >= 14 || Boolean(selectedEstateGeoid);

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
          center={getDefaultCenter(selectedIsland)}
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
                  const geoid = feature?.properties?.geoid ?? null;
                  setSelectedEstateGeoid(geoid);
                  onSelectEstate?.(geoid);
                });
              }}
            />
          )}

          {showParcels && parcelGeoForMap && (
            <GeoJSON
              data={parcelGeoForMap as any}
              style={(feature: any) => ({
                color: selectedParcel?.parcelId === feature?.properties?.parcelId ? '#065f46' : hoveredParcelId === feature?.properties?.parcelId ? '#34d399' : '#f97316',
                weight: selectedParcel?.parcelId === feature?.properties?.parcelId ? 3 : hoveredParcelId === feature?.properties?.parcelId ? 2 : 1.2,
                fillColor: '#fdba74',
                fillOpacity: selectedParcel?.parcelId === feature?.properties?.parcelId ? 0.4 : 0.2,
              })}
              onEachFeature={(feature: any, layer) => {
                layer.on('mouseover', () => {
                  setHoveredParcelId(feature?.properties?.parcelId ?? null);
                });
                layer.on('mouseout', () => {
                  setHoveredParcelId(null);
                });
                layer.on('click', () => {
                  const parcel = toSelectedParcel(feature?.properties as ParcelFeatureProperties);
                  if (!parcel) return;
                  setSelectedParcel(parcel);
                  onSelectParcel?.(parcel);
                });
              }}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-3 left-3">
          <ParcelMapLegend parcelVisible={showParcels} />
        </div>
        <ParcelDetailCard
          parcel={selectedParcel}
          onClose={() => {
            setSelectedParcel(null);
            onSelectParcel?.(null);
          }}
          onUseAsDestination={(parcel) => {
            const match = visibleParcels.find((record) => record.parcelId === parcel.parcelId);
            if (match) onUseParcelForRoute?.(match);
          }}
          onExploreNearby={(parcel) => {
            console.log('Explore nearby parcel', parcel);
          }}
          onAskConcierge={(parcel) => {
            const match = visibleParcels.find((record) => record.parcelId === parcel.parcelId);
            if (match) onAskConcierge?.(match);
          }}
        />
      </div>
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

function mapIslandCode(code: IslandCode | "all" | GeographyIslandCode): ParcelIslandCode | "all" {
  if (code === 'all' || code === 'stt' || code === 'stj' || code === 'stx' || code === 'wat' || code === 'unk') {
    return code;
  }
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

function getDefaultCenter(code: IslandCode | "all" | GeographyIslandCode): [number, number] {
  if (code === 'all') return DEFAULT_CENTER.st_thomas;
  if (code === 'stt') return DEFAULT_CENTER.st_thomas;
  if (code === 'stj') return DEFAULT_CENTER.st_john;
  if (code === 'stx') return DEFAULT_CENTER.st_croix;
  if (code === 'wat') return DEFAULT_CENTER.water_island;
  return DEFAULT_CENTER[code];
}

function toSelectedParcel(properties: ParcelFeatureProperties | undefined): SelectedParcel {
  if (!properties || typeof properties.parcelId !== "string") return null;
  return {
    parcelId: properties.parcelId,
    label: properties.label?.trim() ? properties.label : properties.parcelId,
    island: properties.island ?? 'unk',
    estateName: properties.estateName ?? null,
    estateGeoid: properties.estateGeoid ?? null,
    address: properties.address ?? null,
    sourceParcelNo: properties.sourceParcelNo ?? null,
    centroid: {
      lat: typeof properties.centroidLat === 'number' ? properties.centroidLat : null,
      lng: typeof properties.centroidLng === 'number' ? properties.centroidLng : null,
    },
  };
}
