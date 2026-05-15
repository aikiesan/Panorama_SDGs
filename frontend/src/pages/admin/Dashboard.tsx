import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../components/layout/Header';
import { adminAPI } from '../../services/api/admin';
import type { Project, WorkflowStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { downloadProjectsCSV } from '../../utils/exportUtils';
import { SDGS } from '../../utils/constants';

const STATUS_BORDER: Record<string, string> = {
  approved: 'border-l-green-500',
  rejected: 'border-l-red-500',
  submitted: 'border-l-yellow-500',
  in_review: 'border-l-blue-500',
  changes_requested: 'border-l-orange-500',
};

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_review: 'bg-blue-100 text-blue-800 border-blue-200',
  changes_requested: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // KPI counts
  const [totalAll, setTotalAll] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalVoted, setTotalVoted] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);

  // Filters (only for "all" tab)
  const [statusFilter, setStatusFilter] = useState('');
  const [votedFilter, setVotedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchKPIs = useCallback(async () => {
    try {
      const [allData, pendingData, votedData, approvedData] = await Promise.all([
        adminAPI.getAllProjects(1, 1),
        adminAPI.getPendingProjects(1, 1),
        adminAPI.getAllProjects(1, 1, undefined, true),
        adminAPI.getAllProjects(1, 1, 'APPROVED'),
      ]);
      setTotalAll(allData.total);
      setTotalPending(pendingData.total);
      setTotalVoted(votedData.total);
      setTotalApproved(approvedData.total);
    } catch {}
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'pending') {
        data = await adminAPI.getPendingProjects(page, 20);
      } else {
        data = await adminAPI.getAllProjects(
          page,
          20,
          statusFilter || undefined,
          votedFilter === 'yes' ? true : votedFilter === 'no' ? false : null,
          search || undefined,
        );
      }
      setProjects(data.projects);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, statusFilter, votedFilter, search]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans">
      {/* Admin Header */}
      <nav className="bg-mapbox-card border-b border-mapbox-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center font-bold text-white">A</div>
            <span className="text-lg font-semibold text-mapbox-light">{t('admin.dashboard_title')}</span>
          </div>
          <div className="flex items-center space-x-6">
            <LanguageToggle />
            <button
              onClick={downloadProjectsCSV}
              className="text-sm font-medium text-mapbox-gray hover:text-mapbox-light transition-colors flex items-center gap-2 border border-mapbox-border px-3 py-1.5 rounded-md hover:bg-mapbox-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('admin.export_csv')}
            </button>
            <span className="text-sm text-mapbox-gray">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-mapbox-gray uppercase tracking-wider mb-2">{t('admin.kpi_total')}</h3>
            <p className="text-3xl font-bold text-mapbox-light">{totalAll}</p>
          </div>
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-mapbox-gray uppercase tracking-wider mb-2">{t('admin.kpi_pending')}</h3>
            <p className="text-3xl font-bold text-yellow-500">{totalPending}</p>
          </div>
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-mapbox-gray uppercase tracking-wider mb-2">{t('admin.kpi_voted')}</h3>
            <p className="text-3xl font-bold text-primary-500">{totalVoted}</p>
          </div>
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-mapbox-gray uppercase tracking-wider mb-2">{t('admin.kpi_approved')}</h3>
            <p className="text-3xl font-bold text-green-500">{totalApproved}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-mapbox-border">
          <button
            onClick={() => { setActiveTab('pending'); setPage(1); }}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-mapbox-gray hover:text-mapbox-light'
            }`}
          >
            {t('admin.tab_pending')}
          </button>
          <button
            onClick={() => { setActiveTab('all'); setPage(1); }}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-mapbox-gray hover:text-mapbox-light'
            }`}
          >
            {t('admin.tab_all')}
          </button>
        </div>

        {/* Filters (only in "all" tab) */}
        {activeTab === 'all' && (
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-mapbox-dark border border-mapbox-border text-mapbox-light text-sm px-3 py-2 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('admin.filter_all_statuses')}</option>
              <option value="SUBMITTED">{t('status.submitted')}</option>
              <option value="IN_REVIEW">{t('status.in_review')}</option>
              <option value="APPROVED">{t('status.approved')}</option>
              <option value="REJECTED">{t('status.rejected')}</option>
              <option value="CHANGES_REQUESTED">{t('status.changes_requested')}</option>
            </select>

            {/* Voted filter */}
            <select
              value={votedFilter}
              onChange={e => { setVotedFilter(e.target.value as any); setPage(1); }}
              className="bg-mapbox-dark border border-mapbox-border text-mapbox-light text-sm px-3 py-2 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{t('admin.filter_voted_all')}</option>
              <option value="yes">{t('admin.filter_voted_yes')}</option>
              <option value="no">{t('admin.filter_voted_no')}</option>
            </select>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t('admin.search_placeholder')}
                className="bg-mapbox-dark border border-mapbox-border text-mapbox-light text-sm px-3 py-2 rounded-md w-64 focus:ring-primary-500 focus:border-primary-500 placeholder-mapbox-gray"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  className="px-3 py-2 text-mapbox-gray text-sm hover:text-mapbox-light"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-mapbox-card border border-mapbox-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-mapbox-gray">{t('admin.no_projects')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-mapbox-border">
                <thead className="bg-mapbox-dark">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_project')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden md:table-cell">{t('admin.col_org')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden lg:table-cell">{t('admin.col_location')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_status')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden xl:table-cell">{t('admin.col_sdgs')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_vote')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden sm:table-cell">{t('admin.col_date')}</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mapbox-border">
                  {projects.map((project) => {
                    const borderClass = STATUS_BORDER[project.workflowStatus] ?? 'border-l-mapbox-border';
                    const badgeClass = STATUS_BADGE[project.workflowStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200';
                    const hasVote = project.adminVoteSdgs && project.adminVoteSdgs.length === 3;
                    return (
                      <tr
                        key={project.id}
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className={`border-l-4 ${borderClass} hover:bg-mapbox-dark/50 transition-colors cursor-pointer`}
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-mapbox-light flex items-center gap-2">
                            {project.projectName}
                            {!hasVote && (project.workflowStatus === 'submitted' || project.workflowStatus === 'in_review') && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-primary-900/40 text-primary-400 border border-primary-700 rounded font-bold uppercase">Vote</span>
                            )}
                          </div>
                          <div className="text-xs text-mapbox-gray mt-0.5">ID: {project.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-mapbox-gray hidden md:table-cell">
                          {project.organizationName}
                        </td>
                        <td className="px-5 py-4 text-sm text-mapbox-gray hidden lg:table-cell">
                          {project.city}, {project.country}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${badgeClass} whitespace-nowrap`}>
                            {t(`status.${project.workflowStatus}` as any) || project.workflowStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden xl:table-cell">
                          <div className="flex flex-wrap gap-0.5">
                            {project.sdgs.slice(0, 6).map(entry => {
                              const sdg = SDGS.find(s => s.id === entry.sdg_number);
                              return (
                                <span
                                  key={entry.sdg_number}
                                  className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-sm"
                                  style={{ backgroundColor: sdg?.color ?? '#888' }}
                                  title={String(entry.sdg_number)}
                                >
                                  {entry.sdg_number}
                                </span>
                              );
                            })}
                            {project.sdgs.length > 6 && (
                              <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-mapbox-gray bg-mapbox-dark border border-mapbox-border rounded-sm">
                                +{project.sdgs.length - 6}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {hasVote ? (
                            <div className="flex items-center gap-1">
                              <span className="text-green-500 text-xs font-bold">✓ {t('admin.vote_done')}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-mapbox-gray">— {t('admin.vote_pending')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-mapbox-gray hidden sm:table-cell whitespace-nowrap">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <Link
                            to={`/admin/projects/${project.id}`}
                            className="text-primary-500 hover:text-primary-400 font-semibold text-sm"
                          >
                            {t('admin.action_review')}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-mapbox-border flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-mapbox-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('admin.page_prev')}
            </button>
            <span className="text-sm text-mapbox-gray">
              Page {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-mapbox-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('admin.page_next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
