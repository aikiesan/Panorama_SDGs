import L from 'leaflet';

// Official UN SDG colors
export const SDG_COLORS: Record<number, string> = {
  1:  '#E5243B',
  2:  '#DDA63A',
  3:  '#4C9F38',
  4:  '#C5192D',
  5:  '#FF3A21',
  6:  '#26BDE2',
  7:  '#FCC30B',
  8:  '#A21942',
  9:  '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
};

// 5 UIA Section colors — bold and geographically distinct
export const REGION_COLORS: Record<string, string> = {
  'Section I - Western Europe':                    '#577CB3',
  'Section II - Eastern Europe & Central Asia':    '#7B68EE',
  'Section III - Middle East & Africa':            '#C0392B',
  'Section IV - Asia & Pacific':                   '#27AE60',
  'Section V - Americas':                          '#E67E22',
};

// Short labels for legend
export const REGION_LABELS: Record<string, string> = {
  'Section I - Western Europe':                    'I — Western Europe',
  'Section II - Eastern Europe & Central Asia':    'II — Eastern Europe & Central Asia',
  'Section III - Middle East & Africa':            'III — Middle East & Africa',
  'Section IV - Asia & Pacific':                   'IV — Asia & Pacific',
  'Section V - Americas':                          'V — Americas',
};

type MarkerSize = 'small' | 'medium' | 'large';

const SIZE_CONFIG = {
  small:  { w: 26, h: 26, font: '9px',  ring: 12 },
  medium: { w: 34, h: 34, font: '11px', ring: 14 },
  large:  { w: 42, h: 42, font: '13px', ring: 16 },
};

/**
 * Creates a marker colored by UIA region with an SDG accent dot.
 * 2023 markers have a dashed inner ring to distinguish them from 2026.
 * Falls back to a neutral slate color for unknown regions.
 */
export function createRegionMarker({
  sdgNumber,
  region,
  projectName,
  size = 'small',
  edition = '2026',
}: {
  sdgNumber?: number;
  region?: string;
  projectName: string;
  size?: MarkerSize;
  edition?: '2023' | '2026';
}): L.DivIcon {
  const regionColor = (region && REGION_COLORS[region]) || '#6C757D';
  const sdgColor   = sdgNumber ? (SDG_COLORS[sdgNumber] || '#888') : null;
  const cfg = SIZE_CONFIG[size];

  // 2023 markers: slightly transparent + dashed inner outline to visually separate editions
  const is2023 = edition === '2023';
  const borderStyle = is2023
    ? `border:2px dashed rgba(255,255,255,0.85);outline:1px solid ${regionColor};`
    : 'border:3px solid white;';
  const opacity = is2023 ? 'opacity:0.88;' : '';

  // Small SDG accent dot in top-right corner (only when SDG is known)
  const accentDot = sdgColor
    ? `<div style="
        position:absolute;
        top:-2px;right:-2px;
        width:${cfg.ring}px;height:${cfg.ring}px;
        background:${sdgColor};
        border:2px solid white;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:bold;font-size:7px;
        box-shadow:0 1px 3px rgba(0,0,0,0.3);
      ">${sdgNumber}</div>`
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative;width:${cfg.w}px;height:${cfg.h}px;" title="${projectName}">
        <div class="region-marker-dot" style="
          width:${cfg.w}px;height:${cfg.h}px;
          background:${regionColor};
          ${borderStyle}
          ${opacity}
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:bold;font-size:${cfg.font};
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          cursor:pointer;
        ">
        </div>
        ${accentDot}
      </div>
    `,
    className: '',
    iconSize:   [cfg.w, cfg.h],
    iconAnchor: [cfg.w / 2, cfg.h / 2],
    popupAnchor: [0, -cfg.h / 2],
  });
}

/**
 * Community submission marker — small gray dot, dashed border, semi-transparent.
 */
export function createCommunityMarker({
  projectName,
}: {
  projectName: string;
}): L.DivIcon {
  const size = 16;
  return L.divIcon({
    html: `<div class="community-marker-dot" style="
      width:${size}px;height:${size}px;
      background:#9CA3AF;
      border:2px dashed #fff;
      border-radius:50%;
      box-shadow:0 1px 3px rgba(0,0,0,0.2);
      opacity:0.7;
      cursor:pointer;
    " title="${projectName}"></div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * Custom cluster icon — dark navy badge with count, scales with density.
 */
export function createRegionClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size  = count < 10 ? 36 : count < 50 ? 46 : count < 150 ? 56 : 66;
  const label = count > 999 ? '999+' : String(count);
  return L.divIcon({
    html: `<div class="region-cluster" style="width:${size}px;height:${size}px;font-size:${size < 46 ? 12 : 14}px;">${label}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Get marker size tier based on funding */
export function getMarkerSizeByFunding(fundingNeeded: number): MarkerSize {
  if (fundingNeeded > 50_000_000) return 'large';
  if (fundingNeeded > 10_000_000) return 'medium';
  return 'small';
}

/** Legacy export kept for compatibility */
export function createSDGMarker({
  sdgNumber,
  projectName,
  size = 'medium',
}: {
  sdgNumber: number;
  projectName: string;
  size?: MarkerSize;
}): L.DivIcon {
  return createRegionMarker({ sdgNumber, projectName, size });
}

export const MARKER_STYLES = `
  .region-marker-dot {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .region-marker-dot:hover {
    transform: scale(1.2) !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.5) !important;
    z-index: 1000 !important;
  }
  .region-cluster {
    background: #1a2a4a;
    border: 3px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    letter-spacing: -0.5px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.45);
    transition: transform 0.15s ease;
    cursor: pointer;
  }
  .region-cluster:hover {
    transform: scale(1.1);
  }
  .community-marker-dot {
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .community-marker-dot:hover {
    transform: scale(1.3) !important;
    opacity: 1 !important;
  }
`;
