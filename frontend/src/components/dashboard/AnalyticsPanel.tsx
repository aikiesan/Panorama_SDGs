import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { FilterOptions } from '../../types';

interface AnalyticsPanelProps {
  filters: FilterOptions;
}

const SDG_COLORS = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2',
  '#FCC30B', '#A21942', '#FD6925', '#DD1367', '#FD9D24', '#BF8B2E',
  '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A',
];

const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
  5: 'Gender Equality', 6: 'Clean Water', 7: 'Affordable Energy', 8: 'Decent Work',
  9: 'Industry & Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
  12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
  15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships',
};

const SECTION_LABELS: Record<string, string> = {
  'Section I - Western Europe':              'S.I — W. Europe',
  'Section II - Eastern Europe & Central Asia': 'S.II — E. Europe',
  'Section III - Middle East & Africa':      'S.III — ME & Africa',
  'Section IV - Asia & Pacific':             'S.IV — Asia',
  'Section V - Americas':                    'S.V — Americas',
};

const SECTION_COLORS: Record<string, string> = {
  'Section I - Western Europe':              '#577CB3',
  'Section II - Eastern Europe & Central Asia': '#7B68EE',
  'Section III - Middle East & Africa':      '#C0392B',
  'Section IV - Asia & Pacific':             '#27AE60',
  'Section V - Americas':                    '#E67E22',
};

const STATUS_COLORS: Record<string, string> = {
  'Implemented': '#22c55e',
  'In Progress': '#3b82f6',
  'Needed but Constrained': '#f59e0b',
  'Planned': '#8b5cf6',
  'Unknown': '#9ca3af',
};

const EDITION_COLORS: Record<string, string> = {
  '2023': '#484675',
  '2026': '#577CB3',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

const CustomSDGTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { sdg, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-bold text-gray-900">SDG {sdg}: {SDG_NAMES[sdg] ?? ''}</p>
      <p className="text-gray-600">{count} project{count !== 1 ? 's' : ''}</p>
    </div>
  );
};

const CustomCountryTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { country, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-bold text-gray-900">{country}</p>
      <p className="text-gray-600">{count} project{count !== 1 ? 's' : ''}</p>
    </div>
  );
};

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-display font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function AnalyticsPanel({ filters }: AnalyticsPanelProps) {
  const [sdgData, setSdgData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [typologyData, setTypologyData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [editionData, setEditionData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSDG, setActiveSDG] = useState<number | null>(null);

  // Fetch edition + heatmap (re-run when showSubmissions changes)
  useEffect(() => {
    let cancelled = false;
    const fetchStatic = async () => {
      try {
        const [edition, heatmap] = await Promise.all([
          dashboardAPI.getEditionComparison(filters),
          dashboardAPI.getSdgRegionHeatmap(filters),
        ]);
        if (cancelled) return;
        setEditionData(edition);
        setHeatmapData(heatmap);
      } catch (error) {
        console.error('Static analytics fetch error:', error);
      }
    };
    fetchStatic();
    return () => { cancelled = true; };
  }, [filters.showSubmissions]);

  // Fetch filter-dependent data (respects both filters and activeSDG drill-down)
  useEffect(() => {
    let cancelled = false;
    const drillFilters: FilterOptions = activeSDG
      ? { ...filters, sdgs: [activeSDG as any] }
      : filters;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sdg, region, typology, country, status] = await Promise.all([
          dashboardAPI.getSDGDistribution(filters),
          dashboardAPI.getRegionalDistribution(drillFilters),
          dashboardAPI.getTypologyDistribution(drillFilters),
          dashboardAPI.getCountryDistribution(drillFilters),
          dashboardAPI.getStatusDistribution(drillFilters),
        ]);
        if (cancelled) return;
        setSdgData(sdg);
        setRegionData(
          region.map((r: any) => ({
            ...r,
            label: SECTION_LABELS[r.region] ?? r.region,
            fill: SECTION_COLORS[r.region] ?? '#577CB3',
          }))
        );
        setTypologyData(typology.slice(0, 10));
        setCountryData(country);
        setStatusData(status);
      } catch (error) {
        console.error('Analytics fetch error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [filters, activeSDG]);

  // KPI derivations
  const totalProjects = useMemo(
    () => sdgData.reduce((max, d) => Math.max(max, 0), 0) || countryData.reduce((s, c) => s + c.count, 0),
    [sdgData, countryData]
  );
  const totalCountries = useMemo(() => countryData.length, [countryData]);
  const topSdg = useMemo(() => {
    if (!sdgData.length) return null;
    return sdgData.reduce((best, d) => (d.count > best.count ? d : best));
  }, [sdgData]);
  const avgSdgsPerProject = useMemo(() => {
    if (!sdgData.length || !totalProjects) return '—';
    const total = sdgData.reduce((s, d) => s + d.count, 0);
    return (total / Math.max(totalProjects, 1)).toFixed(1);
  }, [sdgData, totalProjects]);

  // Heatmap derived structure: Map<region, Map<sdg, count>>
  const heatmapGrid = useMemo(() => {
    const grid: Record<string, Record<number, number>> = {};
    for (const d of heatmapData) {
      if (!grid[d.region]) grid[d.region] = {};
      grid[d.region][d.sdg] = d.count;
    }
    return grid;
  }, [heatmapData]);
  const heatmapMax = useMemo(
    () => Math.max(1, ...heatmapData.map((d) => d.count)),
    [heatmapData]
  );
  const heatmapRegions = useMemo(() => Object.keys(heatmapGrid).sort(), [heatmapGrid]);

  // Radar data: top 8 typologies
  const radarData = useMemo(
    () => typologyData.slice(0, 8).map((t) => ({ typology: t.typology.slice(0, 20), count: t.count })),
    [typologyData]
  );

  if (loading && !sdgData.length) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-uia-blue/20 border-t-uia-blue rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">

      {/* Page header */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Project Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Global overview of UIA's urban innovation work and SDG progression
            {filters.region && filters.region !== 'All Regions' ? ` · ${filters.region}` : ''}
            {(filters.sdgs ?? []).length > 0 ? ` · SDG ${(filters.sdgs ?? []).join(', ')}` : ''}
          </p>
        </div>
        {activeSDG && (
          <button
            onClick={() => setActiveSDG(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-uia-blue text-white text-xs rounded-full hover:bg-uia-blue/80 transition-colors"
          >
            Drill-down: SDG {activeSDG} &nbsp;×
          </button>
        )}
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Projects" value={totalProjects || '—'} sub="Approved in Guidebook" />
        <KpiCard label="Countries Reached" value={totalCountries} sub="Unique countries" />
        <KpiCard
          label="Primary SDG Focus"
          value={topSdg ? `SDG ${topSdg.sdg}` : '—'}
          sub={topSdg ? SDG_NAMES[topSdg.sdg] : undefined}
        />
        <KpiCard label="Avg SDGs / Project" value={avgSdgsPerProject} sub="SDG links per project" />
      </motion.div>

      {/* ── SDG Distribution (clickable for drill-down) ── */}
      <motion.section {...fadeUp(0.1)} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900">SDG Impact Distribution</h3>
          {!activeSDG && (
            <span className="text-xs text-gray-400 italic">Click a bar to drill down</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Projects linked to each Sustainable Development Goal</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sdgData} margin={{ bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="sdg" stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomSDGTooltip />} />
              <Bar
                dataKey="count"
                name="Projects"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d: any) => setActiveSDG(d.sdg === activeSDG ? null : d.sdg)}
              >
                {sdgData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SDG_COLORS[(entry.sdg - 1) % SDG_COLORS.length]}
                    opacity={activeSDG && activeSDG !== entry.sdg ? 0.35 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ── Edition Comparison ── */}
      <motion.section {...fadeUp(0.15)} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Projects by Guidebook Edition</h3>
        <p className="text-xs text-gray-400 mb-4">Comparing 2023 and 2026 UIA Guidebook contributions</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={editionData} layout="vertical" margin={{ left: 8, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="edition" type="category" stroke="#9ca3af" width={48} tick={{ fontSize: 13, fontWeight: 600 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', fontSize: 12 }}
                formatter={(value: any) => [`${value} projects`, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={32}>
                {editionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={EDITION_COLORS[entry.edition] ?? '#577CB3'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ── Row: Regional + Status (filter-dependent) ── */}
      <motion.div {...fadeUp(0.2)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Projects by UIA Section</h3>
          <p className="text-xs text-gray-400 mb-4">
            {activeSDG ? `SDG ${activeSDG} — ` : ''}Distribution across five UIA geographic sections
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="40%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="projectCount"
                  nameKey="label"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill ?? '#577CB3'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', fontSize: 12 }}
                  formatter={(value: any, _: any, props: any) => [
                    `${value} projects`,
                    props.payload.label,
                  ]}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Project Status Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">
            {activeSDG ? `SDG ${activeSDG} — ` : ''}Current implementation stage
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="status" type="category" stroke="#9ca3af" width={160} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', fontSize: 12 }}
                  formatter={(value: any) => [`${value} projects`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </motion.div>

      {/* ── SDG × Region Heatmap ── */}
      {heatmapRegions.length > 0 && (
        <motion.section {...fadeUp(0.25)} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">SDG × UIA Region Heatmap</h3>
          <p className="text-xs text-gray-400 mb-4">Project concentration per SDG in each UIA geographical section</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left pr-3 py-1 text-gray-400 font-medium w-40 sticky left-0 bg-white">Section</th>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((sdg) => (
                    <th key={sdg} className="text-center px-1 py-1 font-bold" style={{ color: SDG_COLORS[sdg - 1], minWidth: '28px' }}>
                      {sdg}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapRegions.map((region) => (
                  <tr key={region} className="border-t border-gray-100">
                    <td className="pr-3 py-1.5 text-gray-600 font-medium sticky left-0 bg-white whitespace-nowrap">
                      {SECTION_LABELS[region] ?? region}
                    </td>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map((sdg) => {
                      const count = heatmapGrid[region]?.[sdg] ?? 0;
                      const intensity = count / heatmapMax;
                      return (
                        <td key={sdg} className="text-center px-1 py-1.5">
                          <div
                            title={`${region}, SDG ${sdg}: ${count} projects`}
                            className="w-6 h-6 rounded flex items-center justify-center mx-auto text-[10px] font-medium transition-transform hover:scale-125"
                            style={{
                              backgroundColor: `rgba(87, 124, 179, ${intensity * 0.9 + 0.05})`,
                              color: intensity > 0.5 ? '#fff' : '#374151',
                            }}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* ── Row: Country + Typology Radar ── */}
      <motion.div {...fadeUp(0.3)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Top Countries</h3>
          <p className="text-xs text-gray-400 mb-4">
            {activeSDG ? `SDG ${activeSDG} — ` : ''}Countries with most approved projects (top 15)
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="country" type="category" stroke="#9ca3af" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomCountryTooltip />} />
                <Bar dataKey="count" fill="#577CB3" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Typology Radar</h3>
          <p className="text-xs text-gray-400 mb-4">
            {activeSDG ? `SDG ${activeSDG} — ` : ''}Top 8 urban intervention types
          </p>
          <div className="h-80">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="typology"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Projects"
                    dataKey="count"
                    stroke="#484675"
                    fill="#484675"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', fontSize: 12 }}
                    formatter={(value: any) => [`${value} projects`, 'Count']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No typology data</div>
            )}
          </div>
        </section>
      </motion.div>

    </div>
  );
}
