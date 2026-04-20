import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api/admin';
import Lightbox from '../../components/common/Lightbox';
import type { Project } from '../../types';

export default function ProjectReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [changesMessage, setChangesMessage] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const data = await adminAPI.getProject(id);
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      // Handle error (e.g., toast notification)
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to approve and publish this project?')) return;

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
    if (!window.confirm('Are you sure you want to unpublish this project? It will be hidden from the public dashboard.')) return;

    setActionLoading(true);
    try {
      // Using updateProject to reset status to submitted (so it can be reviewed again)
      // Note: casting to any because workflowStatus isn't in ProjectSubmission but is accepted by backend update
      await adminAPI.updateProject(project.id, { workflow_status: 'submitted' } as any);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error unpublishing project:', error);
    } finally {
      setActionLoading(false);
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
    return <div className="min-h-screen bg-mapbox-black text-white p-8">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans pb-20">
      {/* Header */}
      <div className="bg-mapbox-card border-b border-mapbox-border px-6 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/admin/dashboard" className="text-mapbox-gray hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-white truncate max-w-2xl">{project.projectName}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full border bg-mapbox-dark text-mapbox-gray border-mapbox-border`}>
            {project.workflowStatus}
          </span>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/admin/projects/${project.id}/edit`}
            className="px-4 py-2 border border-blue-500 text-blue-400 rounded-md hover:bg-blue-900/20 transition-colors flex items-center"
          >
            Edit
          </Link>
          {project.workflowStatus === 'approved' ? (
            <button
              onClick={handleUnpublish}
              disabled={actionLoading}
              className="px-4 py-2 border border-orange-500 text-orange-400 rounded-md hover:bg-orange-900/20 transition-colors disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowChangesModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-yellow-500 text-yellow-400 rounded-md hover:bg-yellow-900/20 transition-colors disabled:opacity-50"
              >
                Request Changes
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-red-900 text-red-400 rounded-md hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Approve & Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Descriptions */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">Brief Description</h3>
            <p className="text-white leading-relaxed">{project.briefDescription}</p>
            
            <div className="my-6 border-t border-mapbox-border"></div>
            
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">Detailed Description</h3>
            <p className="text-white leading-relaxed whitespace-pre-line">{project.detailedDescription}</p>
          </div>

          {/* Success Factors */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-4">Success Factors</h3>
            <div className="bg-green-900/10 border border-green-900/30 rounded-lg p-4">
              <p className="text-green-100 whitespace-pre-line">{project.successFactors}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-mapbox-gray uppercase tracking-wider mb-6">Implementation Requirements</h3>
            <div className="space-y-6">
              {project.fundingRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 mb-2">Funding</h4>
                  <ul className="list-disc list-inside text-sm text-white space-y-1">
                    {project.fundingRequirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {project.otherFundingText && (
                    <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherFundingText}</p>
                  )}
                </div>
              )}
              {project.governmentRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 mb-2">Government</h4>
                  <ul className="list-disc list-inside text-sm text-white space-y-1">
                    {project.governmentRequirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {project.otherGovText && (
                    <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherGovText}</p>
                  )}
                </div>
              )}
              {project.otherRequirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 mb-2">Other</h4>
                  <ul className="list-disc list-inside text-sm text-white space-y-1">
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
            <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-4">
              <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-3">
                Project Images ({project.imageUrls.length})
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
                    className="text-xs text-primary-400 hover:underline"
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

          {/* Organization */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-xs text-mapbox-gray">Organization</span>
                <span className="block text-sm font-medium text-white">{project.organizationName}</span>
              </div>
              {project.authors && (
                <div>
                  <span className="block text-xs text-mapbox-gray">Architect(s) / Authors</span>
                  <span className="block text-sm font-medium text-white">{project.authors}</span>
                </div>
              )}
              <div>
                <span className="block text-xs text-mapbox-gray">Contact Person</span>
                <span className="block text-sm font-medium text-white">{project.contactPerson}</span>
              </div>
              <div>
                <span className="block text-xs text-mapbox-gray">Email</span>
                <a href={`mailto:${project.contactEmail}`} className="block text-sm font-medium text-primary-400 hover:underline">
                  {project.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Location & Specs */}
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-4">Project Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-mapbox-border pb-2">
                <span className="text-sm text-mapbox-gray">City</span>
                <span className="text-sm font-medium text-white">{project.city}</span>
              </div>
              <div className="flex justify-between border-b border-mapbox-border pb-2">
                <span className="text-sm text-mapbox-gray">Country</span>
                <span className="text-sm font-medium text-white">{project.country}</span>
              </div>
              <div className="flex justify-between border-b border-mapbox-border pb-2">
                <span className="text-sm text-mapbox-gray">Region</span>
                <span className="text-sm font-medium text-white text-right">{project.uiaRegion}</span>
              </div>
              <div>
                <span className="block text-xs text-mapbox-gray mb-1">Typologies</span>
                <div className="flex flex-wrap gap-1">
                  {project.typologies.map(t => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-mapbox-dark border border-mapbox-border rounded text-mapbox-gray">
                      {t}
                    </span>
                  ))}
                </div>
                {project.otherTypologyText && (
                  <p className="text-xs text-mapbox-gray mt-1 italic">Note: {project.otherTypologyText}</p>
                )}
              </div>
              <div>
                <span className="block text-xs text-mapbox-gray mb-1">SDGs</span>
                <div className="flex flex-wrap gap-1">
                  {project.sdgs.map(s => (
                    <span key={s} className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white rounded bg-primary-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(project.fundingNeeded != null || project.fundingSpent != null) && (
            <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
              <h3 className="text-xs font-bold text-mapbox-gray uppercase tracking-wider mb-4">Financials</h3>
              <div className="space-y-4">
                {project.fundingNeeded != null && (
                  <div>
                    <span className="block text-xs text-mapbox-gray">Funding Needed</span>
                    <span className="block text-xl font-mono text-white">${project.fundingNeeded.toLocaleString()}</span>
                  </div>
                )}
                {project.fundingSpent != null && (
                  <div>
                    <span className="block text-xs text-mapbox-gray">Funding Spent</span>
                    <span className="block text-xl font-mono text-green-400">${project.fundingSpent.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Reject Project</h3>
            <p className="text-sm text-mapbox-gray mb-4">
              Please provide a reason for rejection. This will be recorded in the audit log.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 bg-mapbox-dark border border-mapbox-border rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 resize-none"
              placeholder="Reason for rejection..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-mapbox-gray hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Request Changes</h3>
            <p className="text-sm text-mapbox-gray mb-4">
              Describe the changes required. The submitter will receive an email with a link to edit their submission.
            </p>
            <textarea
              value={changesMessage}
              onChange={(e) => setChangesMessage(e.target.value)}
              className="w-full h-32 bg-mapbox-dark border border-mapbox-border rounded-md p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-4 resize-none"
              placeholder="Describe the changes needed..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 text-sm text-mapbox-gray hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!changesMessage.trim() || actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
