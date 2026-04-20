import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import { ASSETS, SDG_COLORS } from '../../utils/assets';
import { SDGS } from '../../utils/constants';
import AnimatedCounter from '../common/AnimatedCounter';

const formatCurrency = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
};

interface SDGRow {
  sdg: number;
  count: number;
}

export default function InsightsSection() {
  const [kpis, setKpis] = useState<any>(null);
  const [sdgData, setSdgData] = useState<SDGRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [k, sdg] = await Promise.all([
          dashboardAPI.getKPIs({}),
          dashboardAPI.getSDGDistribution({}),
        ]);
        setKpis(k);
        setSdgData(sdg);
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const sorted = [...sdgData].sort((a, b) => b.count - a.count);
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();
  const maxCount = sorted[0]?.count || 1;

  return (
    <section className="py-20 bg-uia-gray-light border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section eyebrow */}
        <div className="text-center mb-12">
          <p className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide mb-3">Live Barometer</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-black tracking-uia-normal">
            The <span className="text-uia-red">3+3</span> Global Picture
          </h2>
          <p className="text-base font-sans font-light text-uia-dark mt-3 max-w-xl mx-auto">
            Real-time data from {loading ? '—' : (kpis?.totalProjects ?? '—')} projects spanning {loading ? '—' : (kpis?.countriesRepresented ?? '—')} countries — mapping momentum against necessity.
            {apiError && !loading && <span className="block text-[10px] text-gray-400 mt-1">Live data temporarily unavailable.</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-uia-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Panel 1 — Impact Profile */}
            <div className="bg-white border border-gray-200 rounded-none p-6 shadow-sm">
              <p className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide mb-1">Impact Profile</p>
              <h3 className="text-lg font-display font-bold text-black mb-5">Global Reach</h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between border-b border-gray-100 pb-3">
                  <span className="text-sm font-display text-uia-dark uppercase tracking-wide">Projects</span>
                  <span className="text-3xl font-display font-bold text-uia-blue">
                    <AnimatedCounter value={kpis?.totalProjects ?? 0} />
                  </span>
                </div>
                <div className="flex items-end justify-between border-b border-gray-100 pb-3">
                  <span className="text-sm font-display text-uia-dark uppercase tracking-wide">Cities</span>
                  <span className="text-3xl font-display font-bold text-uia-violet">
                    <AnimatedCounter value={kpis?.citiesEngaged ?? 0} />
                  </span>
                </div>
                <div className="flex items-end justify-between border-b border-gray-100 pb-3">
                  <span className="text-sm font-display text-uia-dark uppercase tracking-wide">Countries</span>
                  <span className="text-3xl font-display font-bold text-uia-blue">
                    <AnimatedCounter value={kpis?.countriesRepresented ?? 0} />
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-display text-uia-dark uppercase tracking-wide">Funding Needed</span>
                  <span className="text-2xl font-display font-bold text-uia-red">
                    <AnimatedCounter value={kpis?.totalFundingNeeded ?? 0} formatter={formatCurrency} />
                  </span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold text-uia-dark uppercase tracking-uia-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-uia-blue animate-pulse inline-block" />
                  2023 – 2030 Agenda
                </span>
              </div>
            </div>

            {/* Panel 2 — Top Momentum SDGs */}
            <div className="bg-white border border-gray-200 rounded-none p-6 shadow-sm">
              <p className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide mb-1">Top Momentum</p>
              <h3 className="text-lg font-display font-bold text-black mb-5">Leading SDGs</h3>
              {top3.length === 0 ? (
                <p className="text-sm text-gray-400">No data available</p>
              ) : (
                <div className="space-y-4">
                  {top3.map((row, i) => {
                    const info = SDGS.find((s) => s.id === row.sdg);
                    const pct = Math.round((row.count / maxCount) * 100);
                    return (
                      <div key={row.sdg} className="flex items-center gap-3">
                        <span className="text-lg font-display font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                        <img src={ASSETS.sdgIcon(row.sdg)} alt={`SDG ${row.sdg}`} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-display font-medium text-gray-700 truncate">{info?.name}</span>
                            <span className="text-xs font-bold text-gray-900 ml-2 flex-shrink-0">{row.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: SDG_COLORS[row.sdg] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="text-[10px] font-display font-bold text-uia-dark uppercase tracking-uia-wide">Analyze the top performers</span>
              </div>
            </div>

            {/* Panel 3 — Urgent Needs */}
            <div className="bg-white border border-uia-red rounded-none p-6 shadow-sm">
              <p className="text-xs font-display font-bold text-uia-red uppercase tracking-uia-wide mb-1">Urgent Needs</p>
              <h3 className="text-lg font-display font-bold text-black mb-5">SDG Gaps</h3>
              {bottom3.length === 0 ? (
                <p className="text-sm text-gray-400">No data available</p>
              ) : (
                <div className="space-y-4">
                  {bottom3.map((row, i) => {
                    const info = SDGS.find((s) => s.id === row.sdg);
                    const pct = Math.max(4, Math.round((row.count / maxCount) * 100));
                    return (
                      <div key={row.sdg} className="flex items-center gap-3">
                        <span className="text-lg font-display font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                        <img src={ASSETS.sdgIcon(row.sdg)} alt={`SDG ${row.sdg}`} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-display font-medium text-gray-700 truncate">{info?.name}</span>
                            <span className="text-xs font-bold text-uia-red ml-2 flex-shrink-0">{row.count}</span>
                          </div>
                          <div className="h-1.5 bg-red-50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-uia-red rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-red-100">
                <span className="text-[10px] font-display font-bold text-uia-red uppercase tracking-uia-wide">Identify the critical gaps</span>
              </div>
            </div>

          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-display font-bold text-uia-blue uppercase tracking-uia-wide hover:text-uia-red transition-colors"
          >
            See all projects
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
