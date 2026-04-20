import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useSearchParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { FilterOptions, DashboardKPIs, Project } from '../../types';
import FilterControls from '../../components/dashboard/FilterControls';
import ProjectDetailPanel from '../../components/dashboard/ProjectDetailPanel';
import AnalyticsPanel from '../../components/dashboard/AnalyticsPanel';
import ProjectTable from '../../components/dashboard/ProjectTable';
import {
  createRegionMarker,
  createCommunityMarker,
  createRegionClusterIcon,
  getMarkerSizeByFunding,
  MARKER_STYLES,
  REGION_COLORS,
  REGION_LABELS,
} from '../../components/map/CustomSDGMarker';
import SDGLegend, { LEGEND_STYLES } from '../../components/map/SDGLegend';
import EmptyState, { EMPTY_STATE_STYLES } from '../../components/common/EmptyState';
import AnimatedCounter from '../../components/common/AnimatedCounter';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BASEMAPS = {
  streets: {
    name: 'Streets',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

interface MapMarker {
  id: string;
  projectName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  region: string;
  status?: string;
  fundingNeeded?: number;
  primarySdg?: number;
  imageUrl?: string;
  category?: '2026' | '2023' | 'community';
}


function MarkerImage({
  src, alt, regionColor, region, primarySdg,
}: { src?: string; alt: string; regionColor: string; region?: string; primarySdg?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="h-20 w-full flex flex-col items-center justify-center gap-0.5"
        style={{ background: `linear-gradient(135deg, ${regionColor} 0%, ${regionColor}99 100%)` }}
      >
        <span className="text-white/90 text-[10px] font-medium text-center px-3 leading-tight">
          {region?.replace('Section ', 'S').split(' - ')[1] || 'UIA Project'}
        </span>
        {primarySdg && <span className="text-white text-xs font-bold">SDG {primarySdg}</span>}
      </div>
    );
  }
  return (
    <div className="h-28 w-full overflow-hidden">
      <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

function MapUpdater({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const hasAutoFit = useRef(false);

  useEffect(() => {
    if (markers.length > 0 && !hasAutoFit.current) {
      hasAutoFit.current = true;
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [markers, map]);

  return null;
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalProjects: 0,
    citiesEngaged: 0,
    countriesRepresented: 0,
    totalFundingNeeded: 0,
    totalFundingSpent: 0,
  });
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ region: 'All Regions', sdgs: [], showSubmissions: true });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'table' | 'analytics'>('map');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'f': setShowFilters((p) => !p); break;
        case 'a': setViewMode((m) => m === 'analytics' ? 'map' : 'analytics'); break;
        case 'm': setViewMode('map'); break;
        case 'l': setViewMode('table'); break;
        case '/':
          e.preventDefault();
          (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus();
          break;
        case 'escape':
          if (selectedProject) handleProjectClose();
          else if (viewMode === 'analytics') setViewMode('map');
          else if (showFilters) setShowFilters(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, viewMode, showFilters]);

  // Deep link on mount
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) handleProjectSelect(projectId);
  }, []);

  // Fetch data with 400ms debounce + abort
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (viewMode === 'map') {
          const [kpiData, markerData] = await Promise.all([
            dashboardAPI.getKPIs(filters, controller.signal),
            dashboardAPI.getMapMarkers(filters, controller.signal),
          ]);
          setKpis(kpiData);
          setMarkers(markerData);
        } else {
          const kpiData = await dashboardAPI.getKPIs(filters, controller.signal);
          setKpis(kpiData);
        }
      } catch (error: any) {
        if (error?.code !== 'ERR_CANCELED') console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, viewMode]);

  const handleProjectSelect = async (projectId: string) => {
    try {
      const project = await dashboardAPI.getProject(projectId);
      setSelectedProject(project);
      const p = new URLSearchParams(searchParams);
      p.set('project', projectId);
      setSearchParams(p);
      if (isMobile) setShowFilters(false);
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const handleProjectClose = () => {
    setSelectedProject(null);
    const p = new URLSearchParams(searchParams);
    p.delete('project');
    setSearchParams(p);
  };

  const handleClearFilters = () => setFilters((f) => ({ region: 'All Regions', sdgs: [], showSubmissions: f.showSubmissions }));

  const guidebookMarkers = useMemo(
    () => markers.filter((m) => m.category !== 'community'),
    [markers]
  );

  const communityMarkers = useMemo(
    () => markers.filter((m) => m.category === 'community'),
    [markers]
  );

  const guidebookMarkerElements = useMemo(
    () =>
      guidebookMarkers.map((marker) => ({
        marker,
        icon: createRegionMarker({
          sdgNumber: marker.primarySdg ?? undefined,
          region: marker.region,
          projectName: marker.projectName,
          size: getMarkerSizeByFunding(marker.fundingNeeded || 0),
          edition: (marker.category as '2023' | '2026') ?? '2026',
        }),
      })),
    [guidebookMarkers]
  );

  const communityMarkerElements = useMemo(
    () =>
      communityMarkers.map((marker) => ({
        marker,
        icon: createCommunityMarker({ projectName: marker.projectName }),
      })),
    [communityMarkers]
  );

  // ─── Region legend (inside map) ───
  const RegionLegend = (
    <div className="absolute bottom-8 left-4 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200 min-w-[210px]">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">UIA Sections</p>
      <div className="space-y-1.5">
        {Object.entries(REGION_LABELS).map(([region, label]) => (
          <button
            key={region}
            onClick={() => setFilters((f) => ({ ...f, region: region as any }))}
            className={`flex items-center gap-2 w-full text-left rounded px-1 py-0.5 transition-colors ${
              filters.region === region ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <span style={{ background: REGION_COLORS[region] }} className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" />
            <span className="text-[11px] text-gray-700 leading-tight">{label}</span>
          </button>
        ))}
        {filters.region && filters.region !== 'All Regions' && (
          <button
            onClick={() => setFilters((f) => ({ ...f, region: 'All Regions' }))}
            className="text-[10px] text-gray-400 hover:text-gray-600 w-full text-center pt-1 border-t border-gray-100 mt-1"
          >
            Clear ×
          </button>
        )}
      </div>
      {/* Edition style key */}
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">Edition</p>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-uia-blue border-2 border-white shadow-sm flex-shrink-0" />
          <span className="text-[10px] text-gray-500">2026 Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-uia-blue flex-shrink-0" style={{ border: '2px dashed rgba(255,255,255,0.85)', outline: '1px solid #577CB3', opacity: 0.88 }} />
          <span className="text-[10px] text-gray-500">2023 Selected</span>
        </div>
        {filters.showSubmissions && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" style={{ border: '1.5px dashed white', opacity: 0.7 }} />
            <span className="text-[10px] text-gray-400">Submitted</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <style>{MARKER_STYLES}</style>
      <style>{LEGEND_STYLES}</style>
      <style>{EMPTY_STATE_STYLES}</style>

      {/* ══ TOP BAR ══ */}
      <header className="h-14 flex-shrink-0 flex items-center gap-3 px-4 border-b border-gray-200 bg-white z-50 shadow-sm overflow-visible">
        {/* Left: logo + mobile filter toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/"
            className="p-1.5 text-gray-500 hover:text-uia-red hover:bg-gray-100 rounded-md transition-colors"
            title="Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-display font-bold text-base text-black tracking-uia-normal">Panorama</span>
            <span className="font-display font-bold text-base text-uia-red tracking-uia-normal">SDG</span>
          </div>
          {/* Mobile: filter drawer toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className="md:hidden p-1.5 text-gray-500 hover:text-uia-blue hover:bg-gray-100 rounded-md transition-colors"
            title="Filters (F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Map / List / Analytics toggle */}
          <div className="flex border border-gray-200 rounded-md overflow-hidden text-sm font-display font-medium">
            <button
              onClick={() => setViewMode('map')}
              title="Map view (M)"
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                viewMode === 'map' ? 'bg-uia-blue text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="List view (L)"
              className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-200 transition-colors ${
                viewMode === 'table' ? 'bg-uia-blue text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              title="Analytics (A)"
              className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-200 transition-colors ${
                viewMode === 'analytics' ? 'bg-uia-blue text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ BODY ROW ══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {/* Mobile backdrop */}
        {showFilters && isMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        <aside
          className={[
            'flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden transition-transform duration-300',
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-80 shadow-2xl ${showFilters ? 'translate-x-0' : '-translate-x-full'}`
              : 'w-72 relative translate-x-0',
          ].join(' ')}
        >
          {/* KPI compact grid */}
          <div className="flex-shrink-0 p-4 border-b border-gray-100 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projects</div>
              <div className="text-2xl font-display font-bold text-uia-blue">
                <AnimatedCounter value={kpis.totalProjects} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cities</div>
              <div className="text-2xl font-display font-bold text-uia-violet">
                <AnimatedCounter value={kpis.citiesEngaged} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Countries</div>
              <div className="text-2xl font-display font-bold text-uia-blue">
                <AnimatedCounter value={kpis.countriesRepresented} />
              </div>
            </div>
          </div>

          {/* Filters header */}
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider">Filters</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearFilters}
                className="text-xs text-uia-blue hover:text-uia-red transition-colors font-medium"
              >
                Reset
              </button>
              {isMobile && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Submitted projects toggle — prominent, top of filters */}
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100 bg-gray-50/40">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setFilters((f) => ({ ...f, showSubmissions: !f.showSubmissions }))}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  filters.showSubmissions ? 'bg-uia-blue' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    filters.showSubmissions ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide leading-tight">
                  Submitted (non-selected)
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  {communityMarkers.length > 0
                    ? `${communityMarkers.length} projects · 2023 & 2026`
                    : '2023 & 2026 non-selected'}
                </div>
              </div>
            </label>
          </div>

          {/* Filters scroll area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <FilterControls
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
            {viewMode === 'map' && (
              <SDGLegend
                mode="sidebar"
                activeSdgs={filters.sdgs ?? []}
                onSDGClick={(id) => setFilters((f) => {
                  const current = f.sdgs ?? [];
                  const next = current.includes(id as any)
                    ? current.filter((s) => s !== id)
                    : [...current, id as any];
                  return { ...f, sdgs: next };
                })}
                onClearSdgs={() => setFilters((f) => ({ ...f, sdgs: [] }))}
              />
            )}
          </div>

          {/* Footer: visible count */}
          <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50/80 text-xs text-gray-500">
            {loading ? 'Loading…' : viewMode === 'map'
              ? `${guidebookMarkers.length} selected${filters.showSubmissions && communityMarkers.length > 0 ? ` + ${communityMarkers.length} submitted` : ''} on map`
              : 'Use Map view to see markers'}
          </div>
        </aside>

        {/* ── CENTER: MAP or TABLE ── */}
        <main className="flex-1 relative overflow-hidden">

          {viewMode === 'analytics' ? (
            <div className="h-full overflow-y-auto bg-gray-50">
              <AnalyticsPanel filters={filters} />
            </div>
          ) : viewMode === 'map' ? (
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%', background: '#e5e5e5' }}
              zoomSnap={0.5}
              zoomDelta={0.5}
              wheelPxPerZoomLevel={120}
              scrollWheelZoom={true}
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              <LayersControl position="bottomright">
                {Object.entries(BASEMAPS).map(([key, config]) => (
                  <LayersControl.BaseLayer key={key} name={config.name} checked={key === 'streets'}>
                    <TileLayer attribution={config.attribution} url={config.url} />
                  </LayersControl.BaseLayer>
                ))}
              </LayersControl>

              {/* Guidebook markers — always visible */}
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={40}
                disableClusteringAtZoom={6}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                iconCreateFunction={createRegionClusterIcon}
              >
                {guidebookMarkerElements.map(({ marker, icon }) => (
                  <Marker
                    key={marker.id}
                    position={[marker.latitude, marker.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleProjectSelect(marker.id),
                      mouseover: (e) => e.target.openPopup(),
                      mouseout: (e) => e.target.closePopup(),
                    }}
                  >
                    <Popup
                      className="custom-popup p-0 overflow-hidden"
                      closeButton={false}
                      maxWidth={260}
                      minWidth={220}
                    >
                      <div className="bg-white overflow-hidden text-gray-900 rounded-lg shadow-sm">
                        <MarkerImage
                          src={marker.imageUrl}
                          alt={marker.projectName}
                          regionColor={REGION_COLORS[marker.region] || '#577CB3'}
                          region={marker.region}
                          primarySdg={marker.primarySdg}
                        />
                        <div className="p-3">
                          <h3 className="font-bold text-sm leading-snug mb-1 text-gray-900 line-clamp-2">
                            {marker.projectName}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {marker.city}, {marker.country}
                          </p>
                          <div className="flex justify-between items-center">
                            {marker.status && (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                marker.status === 'Implemented' ? 'bg-green-100 text-green-700' :
                                marker.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {marker.status}
                              </span>
                            )}
                            <button
                              onClick={() => handleProjectSelect(marker.id)}
                              className="text-xs font-medium text-uia-blue hover:text-uia-red hover:underline transition-colors ml-auto"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>

              {/* Community submission markers — only when toggle is on */}
              {filters.showSubmissions && (
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  disableClusteringAtZoom={7}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  iconCreateFunction={(cluster) => {
                    const count = cluster.getChildCount();
                    const size = count < 10 ? 28 : count < 50 ? 36 : 44;
                    return L.divIcon({
                      html: `<div style="width:${size}px;height:${size}px;background:#9CA3AF;border:2px dashed #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${size < 36 ? 10 : 12}px;box-shadow:0 2px 6px rgba(0,0,0,0.25);opacity:0.8;cursor:pointer;">${count > 99 ? '99+' : count}</div>`,
                      className: '',
                      iconSize: [size, size],
                      iconAnchor: [size / 2, size / 2],
                    });
                  }}
                >
                  {communityMarkerElements.map(({ marker, icon }) => (
                    <Marker
                      key={marker.id}
                      position={[marker.latitude, marker.longitude]}
                      icon={icon}
                      eventHandlers={{
                        click: () => handleProjectSelect(marker.id),
                        mouseover: (e) => e.target.openPopup(),
                        mouseout: (e) => e.target.closePopup(),
                      }}
                    >
                      <Popup
                        className="custom-popup p-0 overflow-hidden"
                        closeButton={false}
                        maxWidth={240}
                        minWidth={200}
                      >
                        <div className="bg-white overflow-hidden text-gray-900 rounded-lg shadow-sm">
                          <div className="h-10 bg-gray-100 flex items-center justify-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Submitted
                            </span>
                            <span className="text-[9px] text-gray-300 font-medium">— not selected</span>
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-sm leading-snug mb-1 text-gray-900 line-clamp-2">
                              {marker.projectName}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {marker.city}, {marker.country}
                            </p>
                            <button
                              onClick={() => handleProjectSelect(marker.id)}
                              className="text-xs font-medium text-gray-500 hover:text-uia-blue hover:underline transition-colors"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}

              <MapUpdater markers={guidebookMarkers} />
            </MapContainer>
          ) : (
            <div className="h-full overflow-y-auto bg-gray-50">
              <ProjectTable filters={filters} onProjectClick={(p) => handleProjectSelect(p.id)} />
            </div>
          )}

          {/* Map overlays */}
          {viewMode === 'map' && !loading && markers.length > 0 && RegionLegend}

          {viewMode === 'map' && !loading && markers.length === 0 && (
            <EmptyState
              icon="🌍"
              title="No Projects Found"
              description="No projects match your current filters. Try adjusting your criteria or clearing all filters."
              actionLabel="Clear All Filters"
              onAction={handleClearFilters}
              secondaryActionLabel="View All Projects"
              onSecondaryAction={() => { handleClearFilters(); setViewMode('table'); }}
            />
          )}

          {loading && viewMode === 'map' && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 backdrop-blur-sm pointer-events-none">
              <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl shadow-black/10 flex flex-col items-center gap-4 pointer-events-auto">
                <div className="w-12 h-12 border-4 border-uia-blue/20 border-t-uia-blue rounded-full animate-spin" />
                <p className="text-gray-600 font-medium text-sm">Loading project data…</p>
              </div>
            </div>
          )}

        </main>

        {/* ── RIGHT SIDEBAR: PROJECT DETAIL ── */}
        {selectedProject && (
          isMobile ? (
            /* Mobile: full-screen overlay */
            <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
              <ProjectDetailPanel project={selectedProject} onClose={handleProjectClose} />
            </div>
          ) : (
            /* Desktop: flex sibling */
            <aside className="w-[420px] flex-shrink-0 border-l border-gray-200 flex flex-col overflow-hidden">
              <ProjectDetailPanel project={selectedProject} onClose={handleProjectClose} />
            </aside>
          )
        )}
      </div>
    </div>
  );
}
