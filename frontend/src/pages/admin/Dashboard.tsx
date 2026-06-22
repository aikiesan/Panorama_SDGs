import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../components/layout/Header';
import { adminAPI } from '../../services/api/admin';
import type { Project } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { downloadProjectsCSV } from '../../utils/exportUtils';
import { SDGS } from '../../utils/constants';

type Tab = 'pending' | 'all' | 'archived';

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

const KPI_ICON_PATHS: Record<string, string> = {
  folder: 'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  inbox: 'M4 13h3l2 3h6l2-3h3M4 13V7a2 2 0 012-2h12a2 2 0 012 2v6',
  pin: 'M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z',
  star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  archive: 'M4 7h16M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M10 11h4',
};

function KpiIcon({ name }: { name: string }) {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={KPI_ICON_PATHS[name]} />
    </svg>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);

  // KPI counts
  const [totalAll, setTotalAll] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalVoted, setTotalVoted] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalArchived, setTotalArchived] = useState(0);

  // Filters (used in "all" and "archived" tabs)
  const [statusFilter, setStatusFilter] = useState('');
  const [votedFilter, setVotedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchKPIs = useCallback(async () => {
    try {
      const [allData, pendingData, votedData, approvedData, archivedData] = await Promise.all([
        adminAPI.getAllProjects(1, 1),
        adminAPI.getPendingProjects(1, 1),
        adminAPI.getAllProjects(1, 1, undefined, true),
        adminAPI.getAllProjects(1, 1, 'APPROVED'),
        adminAPI.getAllProjects(1, 1, undefined, null, undefined, true),
      ]);
      setTotalAll(allData.total);
      setTotalPending(pendingData.total);
      setTotalVoted(votedData.total);
      setTotalApproved(approvedData.total);
      setTotalArchived(archivedData.total);
    } catch {}
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const votedArg = votedFilter === 'yes' ? true : votedFilter === 'no' ? false : null;
      let data;
      if (activeTab === 'pending') {
        data = await adminAPI.getPendingProjects(page, 20);
      } else {
        data = await adminAPI.getAllProjects(
          page,
          20,
          statusFilter || undefined,
          votedArg,
          search || undefined,
          activeTab === 'archived' ? true : undefined,
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

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const switchTab = (tab: Tab) => { setActiveTab(tab); setPage(1); };

  const handleArchive = async (e: React.MouseEvent, id: string, archive: boolean) => {
    e.stopPropagation();
    setActionId(id);
    try {
      if (archive) await adminAPI.archiveProject(id);
      else await adminAPI.unarchiveProject(id);
      await Promise.all([fetchProjects(), fetchKPIs()]);
    } catch (error) {
      console.error('Archive action failed:', error);
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const kpis = [
    { label: t('admin.kpi_total'), value: totalAll, color: 'text-mapbox-light', icon: 'folder' },
    { label: t('admin.kpi_pending'), value: totalPending, color: 'text-accent-500', icon: 'inbox' },
    { label: t('admin.kpi_approved'), value: totalApproved, color: 'text-green-600', icon: 'pin' },
    { label: t('admin.kpi_voted'), value: totalVoted, color: 'text-primary-600', icon: 'star' },
    { label: t('admin.kpi_archived'), value: totalArchived, color: 'text-mapbox-gray', icon: 'archive' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: t('admin.tab_pending') },
    { key: 'all', label: t('admin.tab_all') },
    { key: 'archived', label: t('admin.tab_archived') },
  ];

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans">
      {/* Admin Header */}
      <nav className="bg-mapbox-card border-b border-mapbox-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center font-semibold text-white">P</div>
            <span className="text-lg font-semibold text-mapbox-light">Panorama SDG</span>
            <span className="text-xs text-mapbox-gray uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center space-x-5">
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
            <span className="text-sm text-mapbox-gray hidden md:inline">{user?.email}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-400 transition-colors">
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-mapbox-light">{t('admin.dashboard_title')}</h1>
          <p className="text-sm text-mapbox-gray mt-1">{t('admin.dashboard_subtitle')}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-mapbox-card border border-mapbox-border rounded-lg p-5">
              <div className="flex items-center gap-2 text-mapbox-gray mb-2">
                <KpiIcon name={kpi.icon} />
                <h3 className="text-xs font-medium uppercase tracking-wider">{kpi.label}</h3>
              </div>
              <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Segmented control */}
        <div className="inline-flex border border-mapbox-border rounded-lg overflow-hidden mb-6">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-mapbox-border' : ''} ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-mapbox-card text-mapbox-gray hover:text-mapbox-light hover:bg-mapbox-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters (all + archived tabs) */}
        {activeTab !== 'pending' && (
          <div className="flex flex-wrap gap-3 mb-6">
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

            <select
              value={votedFilter}
              onChange={e => { setVotedFilter(e.target.value as 'all' | 'yes' | 'no'); setPage(1); }}
              className="bg-mapbox-dark border border-mapbox-border text-mapbox-light text-sm px-3 py-2 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{t('admin.filter_voted_all')}</option>
              <option value="yes">{t('admin.filter_voted_yes')}</option>
              <option value="no">{t('admin.filter_voted_no')}</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t('admin.search_placeholder')}
                className="bg-mapbox-dark border border-mapbox-border text-mapbox-light text-sm px-3 py-2 rounded-md w-64 focus:ring-primary-500 focus:border-primary-500 placeholder-mapbox-gray"
              />
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors">
                {t('admin.search_button')}
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

        {/* Content */}
        {loading ? (
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 && activeTab === 'pending' ? (
          /* Friendly empty state for a cleared review queue */
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-mapbox-light">{t('admin.empty_pending_title')}</p>
            <p className="text-sm text-mapbox-gray mt-1">{t('admin.empty_pending_desc')}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-12 text-center text-mapbox-gray">
            {t('admin.no_projects')}
          </div>
        ) : (
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-mapbox-border">
                <thead className="bg-mapbox-dark">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_project')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden lg:table-cell">{t('admin.col_location')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_status')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden xl:table-cell">{t('admin.col_sdgs')}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider hidden sm:table-cell">{t('admin.col_date')}</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-mapbox-gray uppercase tracking-wider">{t('admin.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mapbox-border">
                  {projects.map((project) => {
                    const borderClass = STATUS_BORDER[project.workflowStatus] ?? 'border-l-mapbox-border';
                    const badgeClass = STATUS_BADGE[project.workflowStatus] ?? 'bg-gray-100 text-gray-800 border-gray-200';
                    const hasVote = project.adminVoteSdgs && project.adminVoteSdgs.length === 3;
                    const busy = actionId === project.id;
                    return (
                      <tr
                        key={project.id}
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className={`border-l-4 ${borderClass} hover:bg-mapbox-dark/50 transition-colors cursor-pointer`}
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-mapbox-light flex items-center gap-2">
                            {project.projectName}
                            {!hasVote && (project.workflowStatus === 'submitted' || project.workflowStatus === 'in_review') && !project.isArchived && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-primary-100 text-primary-700 border border-primary-200 rounded font-bold uppercase">{t('admin.vote_needed')}</span>
                            )}
                          </div>
                          <div className="text-xs text-mapbox-gray mt-0.5">{project.organizationName}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-mapbox-gray hidden lg:table-cell">
                          {project.city}, {project.country}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${badgeClass} whitespace-nowrap`}>
                              {t(`status.${project.workflowStatus}`)}
                            </span>
                            {project.isArchived && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-600 border-gray-200 whitespace-nowrap">
                                {t('admin.archived_badge')}
                              </span>
                            )}
                          </div>
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
                        <td className="px-5 py-4 text-sm text-mapbox-gray hidden sm:table-cell whitespace-nowrap">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            <Link to={`/admin/projects/${project.id}`} className="text-primary-600 hover:text-primary-500 font-semibold text-sm">
                              {t('admin.action_review')}
                            </Link>
                            {project.isArchived ? (
                              <button
                                onClick={e => handleArchive(e, project.id, false)}
                                disabled={busy}
                                className="text-mapbox-gray hover:text-mapbox-light font-medium text-sm disabled:opacity-40"
                              >
                                {t('admin.action_unarchive')}
                              </button>
                            ) : (
                              <button
                                onClick={e => handleArchive(e, project.id, true)}
                                disabled={busy}
                                className="text-mapbox-gray hover:text-mapbox-light font-medium text-sm disabled:opacity-40"
                              >
                                {t('admin.action_archive')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-mapbox-border flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-mapbox-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.page_prev')}
              </button>
              <span className="text-sm text-mapbox-gray">Page {page} / {totalPages || 1}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-mapbox-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.page_next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
