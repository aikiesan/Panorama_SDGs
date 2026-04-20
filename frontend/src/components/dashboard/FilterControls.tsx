import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { FilterOptions, UIARegion, SDG } from '../../types';

interface FilterControlsProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const regions: (UIARegion | 'All Regions')[] = [
  'All Regions',
  'Section I - Western Europe',
  'Section II - Eastern Europe & Central Asia',
  'Section III - Middle East & Africa',
  'Section IV - Asia & Pacific',
  'Section V - Americas',
];

const SDG_NUMBERS: SDG[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const sdgLabels: Record<SDG, string> = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water',
  7: 'Clean Energy',
  8: 'Decent Work',
  9: 'Innovation',
  10: 'Reduced Inequality',
  11: 'Sustainable Cities',
  12: 'Responsible Consumption',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace & Justice',
  17: 'Partnerships',
};

export default function FilterControls({
  filters,
  onFilterChange,
}: FilterControlsProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [sdgOpen, setSdgOpen] = useState(false);
  const sdgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await dashboardAPI.getFilters();
        setCities(data.cities);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sdgRef.current && !sdgRef.current.contains(e.target as Node)) {
        setSdgOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedSdgs = filters.sdgs ?? [];

  const toggleSdg = (sdg: SDG) => {
    const next = selectedSdgs.includes(sdg)
      ? selectedSdgs.filter((s) => s !== sdg)
      : [...selectedSdgs, sdg];
    onFilterChange({ ...filters, sdgs: next });
  };

  const clearSdgs = () => onFilterChange({ ...filters, sdgs: [] });

  const hasActiveFilters =
    (filters.region && filters.region !== 'All Regions') ||
    (selectedSdgs.length > 0) ||
    (filters.city && filters.city !== 'All Cities') ||
    (filters.search && filters.search !== '') ||
    (filters.edition && filters.edition !== 'all');

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Search Projects
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Name or Country..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 transition-colors hover:border-gray-300 pl-9"
          />
          <svg
            className="absolute left-3 top-3 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Edition Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Guidebook Edition
        </label>
        <select
          value={filters.edition ?? 'all'}
          onChange={(e) =>
            onFilterChange({ ...filters, edition: e.target.value as 'all' | '2023' | '2026' })
          }
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 transition-colors hover:border-gray-300"
        >
          <option value="all">All Editions</option>
          <option value="2023">2023 Guidebook</option>
          <option value="2026">2026 Guidebook</option>
        </select>
      </div>

      {/* Region Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          UIA Region
        </label>
        <select
          value={filters.region || 'All Regions'}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              region: e.target.value as UIARegion | 'All Regions',
            })
          }
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 transition-colors hover:border-gray-300"
        >
          {regions.map((region) => (
            <option key={region} value={region} className="bg-white text-gray-900">
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          City
        </label>
        <select
          value={filters.city || 'All Cities'}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              city: e.target.value === 'All Cities' ? 'All Cities' : e.target.value,
            })
          }
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 transition-colors hover:border-gray-300"
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* SDG Multi-Select Dropdown */}
      <div ref={sdgRef} className="relative">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Sustainable Development Goal
        </label>
        <button
          type="button"
          onClick={() => setSdgOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 transition-colors hover:border-gray-300"
        >
          <span className={selectedSdgs.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
            {selectedSdgs.length === 0
              ? 'All SDGs'
              : selectedSdgs.length === 1
              ? `SDG ${selectedSdgs[0]}: ${sdgLabels[selectedSdgs[0]]}`
              : `${selectedSdgs.length} SDGs selected`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${sdgOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sdgOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {selectedSdgs.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <button
                  onClick={clearSdgs}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear selection
                </button>
              </div>
            )}
            {SDG_NUMBERS.map((sdg) => (
              <label
                key={sdg}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSdgs.includes(sdg)}
                  onChange={() => toggleSdg(sdg)}
                  className="w-4 h-4 rounded border-gray-300 text-uia-blue focus:ring-uia-blue"
                />
                <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{sdg}</span>
                <span className="text-sm text-gray-800">{sdgLabels[sdg]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-3">Active Filters</p>
          <div className="flex flex-wrap gap-2">
            {filters.region && filters.region !== 'All Regions' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                {filters.region}
                <button
                  onClick={() => onFilterChange({ ...filters, region: 'All Regions' })}
                  className="ml-2 text-primary-400 hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            )}
            {filters.city && filters.city !== 'All Cities' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                {filters.city}
                <button
                  onClick={() => onFilterChange({ ...filters, city: 'All Cities' })}
                  className="ml-2 text-primary-400 hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSdgs.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                SDG {selectedSdgs.join(', ')}
                <button onClick={clearSdgs} className="ml-2 text-green-400 hover:text-green-600">
                  ×
                </button>
              </span>
            )}
            {filters.edition && filters.edition !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-uia-blue/10 text-uia-blue border border-uia-blue/20">
                {filters.edition === '2023' ? '2023 Guidebook' : '2026 Guidebook'}
                <button
                  onClick={() => onFilterChange({ ...filters, edition: 'all' })}
                  className="ml-2 text-uia-blue/60 hover:text-uia-blue"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
