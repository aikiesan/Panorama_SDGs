import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import { SDG_COLORS, ASSETS } from '../../utils/assets';
import type { FilterOptions } from '../../types';

interface InsightsDrawerProps {
  filters: FilterOptions;
  onClose: () => void;
}

const REGION_COLORS = ['#577CB3', '#484675', '#AF201C', '#FCC30B', '#4C9F38'];

export default function InsightsDrawer({ filters, onClose }: InsightsDrawerProps) {
  const [sdgData, setSdgData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Responsive chart sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Scroll affordance
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.offsetWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [sdgData, regionData, containerWidth, checkScroll]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const [sdg, region] = await Promise.all([
        dashboardAPI.getSDGDistribution(filters),
        dashboardAPI.getRegionalDistribution(filters),
      ]);
      setSdgData(sdg.slice(0, 6));
      setRegionData(region);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive chart widths from container width (min fallbacks)
  const hasContainer = containerWidth > 80;
  const barWidth  = hasContainer ? Math.max(200, Math.round(containerWidth * 0.40)) : 256;
  const pieWidth  = hasContainer ? Math.max(160, Math.round(containerWidth * 0.30)) : 208;
  const legWidth  = hasContainer ? Math.max(140, Math.round(containerWidth * 0.28)) : 160;

  const isEmpty = !loading && !hasError && sdgData.length === 0 && regionData.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[1990]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[48vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-display font-bold text-sm text-gray-900 uppercase tracking-wide">Insights</h3>
            <p className="text-[10px] text-gray-400 font-display uppercase tracking-widest mt-0.5">Headline charts · current filters</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Close Insights"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-uia-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasError ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-display text-gray-500 uppercase tracking-wide">Insights unavailable</p>
              <button
                onClick={loadData}
                className="text-xs text-uia-blue hover:text-uia-red font-display uppercase tracking-wide transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isEmpty ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-sm font-display text-gray-500 uppercase tracking-wide">No data for current filters</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scroll container */}
              <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 overflow-x-auto overflow-y-hidden h-full"
              >
                <div className="flex gap-4 px-5 py-4 h-full">

                  {/* Chart 1 — Top SDGs */}
                  <div className="flex-shrink-0" style={{ width: barWidth }}>
                    <p className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest mb-2">Top SDGs</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sdgData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="sdg"
                            type="category"
                            width={36}
                            tick={({ x, y, payload }: any) => (
                              <image
                                x={x - 16}
                                y={y - 12}
                                width={24}
                                height={24}
                                href={ASSETS.sdgIcon(payload.value)}
                              />
                            )}
                          />
                          <Tooltip
                            formatter={(v: any) => [`${v} projects`, 'Count']}
                            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                            {sdgData.map((entry) => (
                              <Cell key={entry.sdg} fill={SDG_COLORS[entry.sdg] || '#577CB3'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex-shrink-0 w-px bg-gray-100 self-stretch my-1" />

                  {/* Chart 2 — By Region */}
                  <div className="flex-shrink-0" style={{ width: pieWidth }}>
                    <p className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest mb-2">By Region</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={regionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={52}
                            paddingAngle={3}
                            dataKey="projectCount"
                            nameKey="region"
                          >
                            {regionData.map((_: any, idx: number) => (
                              <Cell key={idx} fill={REGION_COLORS[idx % REGION_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: any, _: any, props: any) => [`${v}`, props.payload.region?.replace('Section ', 'S')]}
                            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex-shrink-0 w-px bg-gray-100 self-stretch my-1" />

                  {/* Chart 3 — Region legend labels */}
                  <div className="flex-shrink-0 flex flex-col justify-center gap-1.5" style={{ width: legWidth }}>
                    <p className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest mb-1">Regions</p>
                    {regionData.map((r: any, i: number) => (
                      <div key={r.region} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: REGION_COLORS[i % REGION_COLORS.length] }} />
                        <span className="text-[10px] text-gray-600 leading-tight truncate">{r.region?.replace(/Section [IVX]+ - /, '')}</span>
                        <span className="text-[10px] font-bold text-gray-900 ml-auto flex-shrink-0">{r.projectCount}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Scroll affordance fade + arrow */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-end pr-1 pointer-events-none bg-gradient-to-r from-transparent to-white">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
