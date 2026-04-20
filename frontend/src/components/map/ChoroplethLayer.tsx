import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { MapMarker } from '../../types';

interface ChoroplethLayerProps {
  markers: MapMarker[];
  visible: boolean;
  onError?: () => void;
}

// Module-level cache so we only fetch once per session
let cachedGeoJson: any = null;

function getCountryFill(count: number, max: number): string {
  if (count === 0 || max === 0) return '#f0f4f8';
  const intensity = Math.min(count / max, 1);
  // Interpolate from light blue (#dbe8f5) → uia-blue (#577CB3)
  const r = Math.round(219 - intensity * (219 - 87));
  const g = Math.round(232 - intensity * (232 - 124));
  const b = Math.round(245 - intensity * (245 - 179));
  return `rgb(${r},${g},${b})`;
}

export default function ChoroplethLayer({ markers, visible, onError }: ChoroplethLayerProps) {
  const [geoJson, setGeoJson] = useState<any>(cachedGeoJson);

  useEffect(() => {
    if (cachedGeoJson) {
      setGeoJson(cachedGeoJson);
      return;
    }
    fetch('/world-countries.geojson')
      .then((r) => r.json())
      .then((data) => {
        cachedGeoJson = data;
        setGeoJson(data);
      })
      .catch((err) => {
        console.error('ChoroplethLayer: failed to load world-countries.geojson', err);
        onError?.();
      });
  }, []);

  if (!visible || !geoJson) return null;

  // Build country name → count map from markers
  const countByCountry = new Map<string, number>();
  for (const m of markers) {
    if (m.country) {
      const key = m.country.toLowerCase().trim();
      countByCountry.set(key, (countByCountry.get(key) ?? 0) + 1);
    }
  }
  const maxCount = Math.max(...Array.from(countByCountry.values()), 1);

  const styleFeature = (feature: any) => {
    const name = (feature?.properties?.ADMIN ?? feature?.properties?.name ?? '').toLowerCase().trim();
    const count = countByCountry.get(name) ?? 0;
    return {
      fillColor: getCountryFill(count, maxCount),
      fillOpacity: count > 0 ? 0.75 : 0.15,
      color: '#b0bec5',
      weight: 0.5,
      opacity: 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature?.properties?.ADMIN ?? feature?.properties?.name ?? 'Unknown';
    const count = countByCountry.get(name.toLowerCase().trim()) ?? 0;
    if (count > 0) {
      layer.bindTooltip(
        `<strong>${name}</strong><br/>${count} project${count !== 1 ? 's' : ''}`,
        { sticky: true, className: 'leaflet-tooltip-choropleth' }
      );
    }
  };

  return (
    <GeoJSON
      key={`choropleth-${markers.length}`}
      data={geoJson}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
