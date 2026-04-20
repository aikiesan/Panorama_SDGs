import { useState, useEffect } from 'react';
import { SDG_COLORS } from './CustomSDGMarker';
import { ASSETS } from '../../utils/assets';

const SDG_INFO = [
  { id: 1,  name: 'No Poverty',              shortName: 'No Poverty' },
  { id: 2,  name: 'Zero Hunger',             shortName: 'Zero Hunger' },
  { id: 3,  name: 'Good Health',             shortName: 'Good Health' },
  { id: 4,  name: 'Quality Education',       shortName: 'Education' },
  { id: 5,  name: 'Gender Equality',         shortName: 'Gender Equality' },
  { id: 6,  name: 'Clean Water',             shortName: 'Clean Water' },
  { id: 7,  name: 'Clean Energy',            shortName: 'Clean Energy' },
  { id: 8,  name: 'Decent Work',             shortName: 'Decent Work' },
  { id: 9,  name: 'Innovation',              shortName: 'Innovation' },
  { id: 10, name: 'Reduced Inequality',      shortName: 'Equality' },
  { id: 11, name: 'Sustainable Cities',      shortName: 'Cities' },
  { id: 12, name: 'Responsible Consumption', shortName: 'Consumption' },
  { id: 13, name: 'Climate Action',          shortName: 'Climate' },
  { id: 14, name: 'Life Below Water',        shortName: 'Oceans' },
  { id: 15, name: 'Life on Land',            shortName: 'Land' },
  { id: 16, name: 'Peace & Justice',         shortName: 'Peace' },
  { id: 17, name: 'Partnerships',            shortName: 'Partnerships' },
];

interface SDGLegendProps {
  onSDGClick?: (sdgId: number) => void;
  onClearSdgs?: () => void;
  activeSdg?: number | null;
  activeSdgs?: number[];
  mode?: 'overlay' | 'sidebar';
}

export default function SDGLegend({ onSDGClick, onClearSdgs, activeSdg, activeSdgs, mode = 'overlay' }: SDGLegendProps) {
  // Normalise: prefer activeSdgs array; fall back to legacy activeSdg single value
  const activeSet = activeSdgs ?? (activeSdg != null ? [activeSdg] : []);

  // Sidebar mode: compact chip grid embedded in the left sidebar
  if (mode === 'sidebar') {
    return (
      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by SDG</p>
          {activeSet.length > 0 && (
            <button
              onClick={() => onClearSdgs?.()}
              className="text-[10px] text-uia-blue hover:text-uia-red transition-colors font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {SDG_INFO.map(({ id, shortName }) => (
            <button
              key={id}
              onClick={() => onSDGClick?.(id)}
              title={`SDG ${id}: ${shortName}`}
              className={`w-full aspect-square rounded overflow-hidden transition-all focus:outline-none
                ${activeSet.includes(id)
                  ? 'ring-2 ring-offset-1 ring-gray-700 scale-110 opacity-100'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
            >
              <img src={ASSETS.sdgIcon(id)} alt={`SDG ${id}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Desktop starts expanded; mobile starts collapsed
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const [hoveredSdg, setHoveredSdg] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Collapse automatically when switching to mobile
      if (mobile) setIsCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isCollapsed) {
    return (
      // Mobile: fixed above zoom controls (bottom-20); Desktop: absolute bottom-6 right-20
      <div className={`z-[500] pointer-events-auto ${isMobile ? 'fixed bottom-20 right-3' : 'absolute bottom-6 right-20'}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          title="Show SDG Legend"
        >
          <div className="flex -space-x-1">
            {[1, 11, 13, 17].map((sdgId) => (
              <div key={sdgId} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: SDG_COLORS[sdgId] }} />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">SDGs</span>
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Mobile: full-width bottom sheet; Desktop: floating panel
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setIsCollapsed(true)} />
        {/* Bottom sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 11, 13].map((sdgId) => (
                  <div key={sdgId} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: SDG_COLORS[sdgId] }} />
                ))}
              </div>
              <h3 className="font-bold text-sm text-gray-900">SDG Legend</h3>
            </div>
            <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {/* SDG grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <p className="text-xs text-gray-500 mb-3">Tap a goal to filter the map</p>
            <div className="grid grid-cols-2 gap-2">
              {SDG_INFO.map((sdg) => {
                const isActive = activeSdg === sdg.id;
                return (
                  <button
                    key={sdg.id}
                    onClick={() => { onSDGClick?.(sdg.id); setIsCollapsed(true); }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                      isActive ? 'ring-2 ring-primary-400 shadow-sm bg-primary-50' : 'hover:bg-gray-50'
                    } ${onSDGClick ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!onSDGClick}
                  >
                    <img
                      src={ASSETS.sdgIcon(sdg.id)}
                      alt={`SDG ${sdg.id}`}
                      loading="lazy"
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium leading-tight ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
                        {sdg.shortName}
                      </div>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Tap a goal to filter the map by SDG.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop: floating panel (original layout)
  return (
    <div className="absolute bottom-6 right-20 z-[500] pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-2xl shadow-black/10 overflow-hidden max-w-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 11, 13].map((sdgId) => (
                <div key={sdgId} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: SDG_COLORS[sdgId] }} />
              ))}
            </div>
            <h3 className="font-bold text-sm text-gray-900">SDG Legend</h3>
          </div>
          <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-white/50 rounded transition-colors" title="Minimize">
            <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* SDG Grid */}
        <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-gray-600 mb-3">Markers are colored by their primary SDG goal</p>
          <div className="grid grid-cols-2 gap-2">
            {SDG_INFO.map((sdg) => {
              const isActive = activeSdg === sdg.id;
              const isHovered = hoveredSdg === sdg.id;
              return (
                <button
                  key={sdg.id}
                  onClick={() => onSDGClick?.(sdg.id)}
                  onMouseEnter={() => setHoveredSdg(sdg.id)}
                  onMouseLeave={() => setHoveredSdg(null)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                    isActive ? 'bg-primary-50 ring-2 ring-primary-300 shadow-sm' :
                    isHovered ? 'bg-gray-50 shadow-sm scale-105' : 'hover:bg-gray-50'
                  } ${onSDGClick ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!onSDGClick}
                >
                  <img
                    src={ASSETS.sdgIcon(sdg.id)}
                    alt={`SDG ${sdg.id}`}
                    loading="lazy"
                    className={`w-8 h-8 rounded object-cover flex-shrink-0 transition-transform ${isHovered ? 'scale-110' : ''}`}
                    style={{ boxShadow: isHovered ? `0 4px 12px ${SDG_COLORS[sdg.id]}40` : '0 2px 4px rgba(0,0,0,0.1)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium leading-tight ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
                      {sdg.shortName}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Markers are colored by UIA region. Click a goal to filter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
`;

export const LEGEND_STYLES = scrollbarStyles;
