import { useState } from 'react';
import type { Project } from '../../types';
import Lightbox from '../../components/common/Lightbox';
import { REGION_COLORS } from '../map/CustomSDGMarker';

const SDG_COLORS: Record<number, string> = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
};

const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
  5: 'Gender Equality', 6: 'Clean Water', 7: 'Affordable Energy', 8: 'Decent Work',
  9: 'Innovation', 10: 'Reduced Inequality', 11: 'Sustainable Cities',
  12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
  15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships',
};

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
}

const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  if (!url.includes('/')) return `/project_images/${url}`;
  return url;
};


export default function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!project) return null;

  const regionColor = REGION_COLORS[project.uiaRegion] || '#577CB3';
  const hasImages = project.imageUrls && project.imageUrls.length > 0;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <>
      {/* Panel fills parent <aside> — no fixed positioning here */}
      <div className="h-full flex flex-col overflow-hidden text-gray-900">

        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-display font-bold text-gray-700 uppercase tracking-wider">Project Details</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-uia-blue"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-900"
              title="Close (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero image / placeholder */}
          {hasImages ? (
            <div className="relative">
              <img
                src={getImageUrl(project.imageUrls[0])}
                alt={project.projectName}
                className="w-full h-52 object-cover cursor-zoom-in"
                onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {project.imageUrls.length > 1 && (
                <div className="flex gap-1.5 px-4 py-2 bg-white border-b border-gray-100 overflow-x-auto">
                  {project.imageUrls.slice(1).map((url, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(url)}
                      alt={`${project.projectName} ${idx + 2}`}
                      className="w-16 h-16 object-cover rounded border border-gray-200 cursor-zoom-in flex-shrink-0 hover:opacity-90 transition-opacity"
                      onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-36 flex flex-col items-center justify-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${regionColor} 0%, ${regionColor}bb 100%)` }}
            >
              <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                {project.uiaRegion?.split(' - ')[1] || 'UIA Project'}
              </span>
              <span className="text-white text-sm font-bold text-center px-6 leading-tight line-clamp-2">
                {project.projectName}
              </span>
            </div>
          )}

          <div className="px-5 py-5 space-y-6">

            {/* Title & status */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{project.projectName}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  project.projectStatus === 'Implemented' ? 'bg-green-100 text-green-700' :
                  project.projectStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.projectStatus}
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ background: regionColor }}
                >
                  {project.uiaRegion?.replace('Section ', 'S').split(' - ')[0]}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <svg className="w-4 h-4 text-uia-blue mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-900">{project.city}, {project.country}</p>
                {project.uiaRegion && (
                  <p className="text-xs text-gray-500 mt-0.5">{project.uiaRegion}</p>
                )}
              </div>
            </div>

            {/* Organization */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Organization</p>
              <p className="text-sm font-semibold text-gray-900">{project.organizationName}</p>
              {project.contactPerson && (
                <p className="text-xs text-gray-600 mt-0.5">{project.contactPerson}</p>
              )}
              {project.contactEmail && project.contactEmail !== 'unknown@unknown.com' && (
                <a href={`mailto:${project.contactEmail}`} className="text-xs text-uia-blue hover:underline mt-1 inline-block">
                  {project.contactEmail}
                </a>
              )}
            </div>

            {/* SDGs */}
            {project.sdgs && project.sdgs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Sustainable Development Goals
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.sdgs.map((sdg) => (
                    <div
                      key={sdg}
                      className="flex items-center justify-center w-10 h-10 rounded font-bold text-white text-sm shadow-sm hover:shadow-md transition-shadow cursor-help"
                      style={{ backgroundColor: SDG_COLORS[sdg] }}
                      title={`SDG ${sdg}: ${SDG_NAMES[sdg]}`}
                    >
                      {sdg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brief description */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Overview</p>
              <p className="text-sm text-gray-700 leading-relaxed">{project.briefDescription}</p>
            </div>

            {/* Detailed description */}
            {project.detailedDescription && project.detailedDescription !== project.briefDescription && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{project.detailedDescription}</p>
              </div>
            )}

            {/* Typologies */}
            {project.typologies && project.typologies.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Typologies</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.typologies.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Success factors */}
            {project.successFactors && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Success Factors</p>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.successFactors}</p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {((project.governmentRequirements?.length ?? 0) > 0 ||
              (project.otherRequirements?.length ?? 0) > 0) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Key Requirements</p>
                <div className="space-y-3">
                  {project.governmentRequirements && project.governmentRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-uia-blue mb-1">Government & Regulatory</p>
                      <ul className="space-y-1">
                        {project.governmentRequirements.map((r, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-uia-blue mt-1.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.otherRequirements && project.otherRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-uia-blue mb-1">Other</p>
                      <ul className="space-y-1">
                        {project.otherRequirements.map((r, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-uia-blue mt-1.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>
      </div>

      <Lightbox
        images={project.imageUrls.map(getImageUrl)}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : project.imageUrls.length - 1))}
        onNext={() => setLightboxIndex((i) => (i < project.imageUrls.length - 1 ? i + 1 : 0))}
      />
    </>
  );
}
