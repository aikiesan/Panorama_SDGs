import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../components/layout/Header';
import { adminAPI } from '../../services/api/admin';
import Lightbox from '../../components/common/Lightbox';
import { SDGS } from '../../utils/constants';
import type { Project } from '../../types';

export default function ProjectReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [changesMessage, setChangesMessage] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // SDG vote state
  const [votedSDGs, setVotedSDGs] = useState<number[]>([]);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteSaved, setVoteSaved] = useState(false);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const data = await adminAPI.getProject(id);
      setProject(data);
      // Pre-populate vote from saved data
      if (data.adminVoteSdgs && data.adminVoteSdgs.length > 0) {
        setVotedSDGs(data.adminVoteSdgs);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;
    if (!window.confirm(t('admin.confirm_approve'))) return;
    setActionLoading(true);
    try {
      await adminAPI.approveProject(project.id);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error approving project:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!project) return;
    setActionLoading(true);
    try {
      await adminAPI.rejectProject(project.id, rejectionReason);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error rejecting project:', error);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!project) return;
    setActionLoading(true);
    try {
      await adminAPI.requestChanges(project.id, changesMessage);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error requesting changes:', error);
    } finally {
      setActionLoading(false);
      setShowChangesModal(false);
    }
  };

  const handleUnpublish = async () => {
    if (!project) return;
    if (!window.confirm(t('admin.confirm_unpublish'))) return;
    setActionLoading(true);
    try {
      await adminAPI.updateProject(project.id, { workflow_status: 'submitted' } as any);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error unpublishing project:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVoteSDG = (id: number) => {
    setVoteSaved(false);
    setVotedSDGs(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // drop oldest
      return [...prev, id];
    });
  };

  const handleSaveVote = async () => {
    if (!project || votedSDGs.length !== 3) return;
    setVoteLoading(true);
    try {
      await adminAPI.voteSDGs(project.id, votedSDGs);
      setVoteSaved(true);
    } catch (error) {
      console.error('Error saving vote:', error);
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mapbox-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen bg-mapbox-black text-mapbox-light p-8">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans pb-20">
      {/* Header */}
      <div className="bg-mapbox-card border-b border-mapbox-border px-6 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/admin/dashboard" className="text-mapbox-gray hover:text-mapbox-light transition-colors">
            ← {t('admin.dashboard_title')}
          </Link>
          <h1 className="text-xl font-bold text-mapbox-light truncate max-w-2xl">{project.projectName}</h1>
          <span className="px-2 py-0.5 text-xs rounded-full border bg-mapbox-dark text-mapbox-gray border-mapbox-border">
            {t(`status.${project.workflowStatus}` as any) || project.workflowStatus}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageToggle />
          <Link
            to={`/admin/projects/${project.id}/edit`}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center font-semibold"
          >
            {t('admin.review_edit')}
          </Link>
          {project.workflowStatus === 'approved' ? (
            <button
              onClick={handleUnpublish}
              disabled={actionLoading}
              className="px-4 py-2 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-50 transition-colors disabled:opacity-50 font-semibold"
            >
              {t('admin.review_unpublish')}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowChangesModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-yellow-600 text-yellow-600 rounded-md hover:bg-yellow-50 transition-colors disabled:opacity-50 font-semibold"
              >
                {t('admin.review_request_changes')}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 font-semibold"
              >
                {t('admin.review_reject')}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 font-semibold"
              >
                {actionLoading ? 'Processing...' : t('admin.review_approve')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Descriptions */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">{t('admin.review_brief')}</h3>
            <p className="text-mapbox-light leading-relaxed">{project.briefDescription}</p>

            <div className="my-6 border-t border-mapbox-border"></div>

            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">{t('admin.review_detailed')}</h3>
            <p className="text-mapbox-light leading-relaxed whitespace-pre-line">{project.detailedDescription}</p>
          </div>

          {/* Success Factors */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">{t('admin.review_success')}</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 whitespace-pre-line">{project.successFactors}</p>
            </div>
          </div>

          {/* Submitter's SDG Selections with Justifications */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">
              {t('admin.review_sdg_submitter')}
            </h3>
            <div className="space-y-4">
              {project.sdgs.length === 0 ? (
                <p className="text-sm text-mapbox-gray italic">No SDGs selected.</p>
              ) : (
                project.sdgs.map(entry => {
                  const sdgInfo = SDGS.find(s => s.id === entry.sdg_number);
                  return (
                    <div key={entry.sdg_number} className="border border-mapbox-border rounded-md p-4 bg-mapbox-dark">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm rounded-sm flex-shrink-0"
                          style={{ backgroundColor: sdgInfo?.color ?? '#888' }}
                        >
                          {entry.sdg_number}
                        </div>
                        <span className="text-sm font-semibold text-mapbox-light">
                          {t(`sdg_names.${entry.sdg_number}` as any)}
                        </span>
                      </div>
                      {entry.justification ? (
                        <div className="ml-11">
                          <span className="text-xs font-bold uppercase text-mapbox-gray tracking-wider block mb-1">
                            {t('admin.review_sdg_justification')}
                          </span>
                          <p className="text-sm text-mapbox-light italic leading-relaxed">
                            "{entry.justification}"
                          </p>
                        </div>
                      ) : (
                        <p className="ml-11 text-xs text-mapbox-gray italic">
                          {t('admin.review_sdg_no_justification')}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-6">{t('admin.review_requirements')}</h3>
            <div className="space-y-6">
              {project.fundingRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-600 mb-2">{t('admin.review_funding')}</h4>
                  <ul className="list-disc list-inside text-sm text-mapbox-light space-y-1">
                    {project.fundingRequirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {project.otherFundingText && (
                    <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherFundingText}</p>
                  )}
                </div>
              )}
              {project.governmentRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-600 mb-2">{t('admin.review_government')}</h4>
                  <ul className="list-disc list-inside text-sm text-mapbox-light space-y-1">
                    {project.governmentRequirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {project.otherGovText && (
                    <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherGovText}</p>
                  )}
                </div>
              )}
              {project.otherRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-600 mb-2">{t('admin.review_other')}</h4>
                  <ul className="list-disc list-inside text-sm text-mapbox-light space-y-1">
                    {project.otherRequirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {project.otherRequirementText && (
                    <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherRequirementText}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meta Info (Right Column) */}
        <div className="space-y-6">
          {/* Images */}
          {project.imageUrls?.length > 0 && (
            <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-3">
                {t('admin.review_images')} ({project.imageUrls.length})
              </h3>
              <div className="space-y-2">
                <img
                  src={project.imageUrls[0]}
                  alt="Main"
                  className="w-full h-48 object-cover rounded-md border border-mapbox-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                />
                <div className="grid grid-cols-3 gap-2">
                  {project.imageUrls.slice(1, 4).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Thumb"
                      className="w-full h-20 object-cover rounded-md border border-mapbox-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
                    />
                  ))}
                </div>
                {project.imageUrls.length > 4 && (
                  <button
                    onClick={() => { setLightboxIndex(4); setLightboxOpen(true); }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    +{project.imageUrls.length - 4} more image{project.imageUrls.length - 4 > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          )}
          <Lightbox
            images={project.imageUrls ?? []}
            initialIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIndex(i => (i - 1 + (project.imageUrls?.length ?? 1)) % (project.imageUrls?.length ?? 1))}
            onNext={() => setLightboxIndex(i => (i + 1) % (project.imageUrls?.length ?? 1))}
          />

          {/* ── ADMIN SDG VOTE PANEL ── */}
          <div className="bg-mapbox-card border-2 border-primary-600/40 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-1">
              {t('admin.vote_panel_title')}
            </h3>
            <p className="text-xs text-mapbox-gray mb-4">{t('admin.vote_panel_subtitle')}</p>

            {/* Previously saved vote indicator */}
            {project.adminVoteSdgs && project.adminVoteSdgs.length > 0 && !voteSaved && (
              <p className="text-xs text-green-500 mb-3">
                {t('admin.vote_already', { sdgs: project.adminVoteSdgs.join(', ') })}
              </p>
            )}
            {voteSaved && (
              <p className="text-xs text-green-500 mb-3 font-semibold">✓ {t('admin.vote_saved')}</p>
            )}

            {/* SDG grid (compact) */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {SDGS.map(sdg => {
                const selected = votedSDGs.includes(sdg.id);
                return (
                  <button
                    key={sdg.id}
                    type="button"
                    onClick={() => toggleVoteSDG(sdg.id)}
                    title={t(`sdg_names.${sdg.id}` as any)}
                    className={`w-full aspect-square flex items-center justify-center text-white font-bold text-sm rounded-sm transition-all ${
                      selected
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-mapbox-dark scale-110'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                    style={{ backgroundColor: sdg.color }}
                  >
                    {sdg.id}
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            <div className="flex items-center gap-2 mb-4 min-h-[28px]">
              <span className="text-xs text-mapbox-gray font-semibold uppercase tracking-wider">
                {t('admin.vote_selected')}:
              </span>
              {votedSDGs.length === 0 ? (
                <span className="text-xs text-mapbox-gray italic">—</span>
              ) : (
                votedSDGs.map(id => {
                  const sdg = SDGS.find(s => s.id === id)!;
                  return (
                    <span
                      key={id}
                      className="px-2 py-0.5 text-xs text-white font-bold rounded-sm"
                      style={{ backgroundColor: sdg.color }}
                    >
                      {id}
                    </span>
                  );
                })
              )}
            </div>

            <button
              onClick={handleSaveVote}
              disabled={votedSDGs.length !== 3 || voteLoading}
              className="w-full py-2 bg-primary-600 text-white text-sm font-semibold rounded-md hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {voteLoading ? '...' : t('admin.vote_save')}
              {votedSDGs.length !== 3 && ` (${votedSDGs.length}/3)`}
            </button>
          </div>

          {/* Contact Information */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-4">{t('admin.review_contact')}</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-xs text-mapbox-gray">Organization</span>
                <span className="block text-sm font-medium text-mapbox-light">{project.organizationName}</span>
              </div>
              {project.authors && (
                <div>
                  <span className="block text-xs text-mapbox-gray">{t('dashboard.detail_authors')}</span>
                  <span className="block text-sm font-medium text-mapbox-light">{project.authors}</span>
                </div>
              )}
              <div>
                <span className="block text-xs text-mapbox-gray">Contact Person</span>
                <span className="block text-sm font-medium text-mapbox-light">{project.contactPerson}</span>
              </div>
              <div>
                <span className="block text-xs text-mapbox-gray">Email</span>
                <a href={`mailto:${project.contactEmail}`} className="block text-sm font-medium text-primary-600 hover:underline">
                  {project.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Location & Specs */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-4">{t('admin.review_details')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-mapbox-border pb-2">
                <span className="text-sm text-mapbox-gray">{t('dashboard.detail_location')}</span>
                <span className="text-sm font-medium text-mapbox-light">{project.city}, {project.country}</span>
              </div>
              <div className="flex justify-between border-b border-mapbox-border pb-2">
                <span className="text-sm text-mapbox-gray">{t('dashboard.detail_region')}</span>
                <span className="text-sm font-medium text-mapbox-light text-right">{project.uiaRegion}</span>
              </div>
              <div>
                <span className="block text-xs text-mapbox-gray mb-1">{t('dashboard.detail_typologies')}</span>
                <div className="flex flex-wrap gap-1">
                  {project.typologies.map(typ => (
                    <span key={typ} className="px-2 py-0.5 text-xs bg-mapbox-dark border border-mapbox-border rounded text-mapbox-gray">
                      {typ}
                    </span>
                  ))}
                </div>
                {project.otherTypologyText && (
                  <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherTypologyText}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-mapbox-light mb-4">{t('admin.modal_reject_title')}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 bg-white border border-mapbox-border rounded-md p-3 text-mapbox-light focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 resize-none"
              placeholder={t('admin.modal_reject_placeholder')}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm text-mapbox-gray hover:text-mapbox-light transition-colors">
                {t('admin.modal_cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '...' : t('admin.modal_confirm_reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-mapbox-light mb-4">{t('admin.modal_changes_title')}</h3>
            <textarea
              value={changesMessage}
              onChange={(e) => setChangesMessage(e.target.value)}
              className="w-full h-32 bg-white border border-mapbox-border rounded-md p-3 text-mapbox-light focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-4 resize-none"
              placeholder={t('admin.modal_changes_placeholder')}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowChangesModal(false)} className="px-4 py-2 text-sm text-mapbox-gray hover:text-mapbox-light transition-colors">
                {t('admin.modal_cancel')}
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!changesMessage.trim() || actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '...' : t('admin.modal_send_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
