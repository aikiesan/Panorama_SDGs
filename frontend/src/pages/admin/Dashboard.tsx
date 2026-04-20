import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api/admin';
import type { Project, WorkflowStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { downloadProjectsCSV } from '../../utils/exportUtils';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'pending'
        ? await adminAPI.getPendingProjects(page, 20)
        : await adminAPI.getAllProjects(page, 20);
      
      setProjects(data.projects);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab, page]);

  const getStatusBadgeColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'changes_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans">
      {/* Admin Header */}
      <nav className="bg-mapbox-card border-b border-mapbox-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center font-bold text-white">A</div>
            <span className="text-lg font-semibold text-white">Admin Dashboard</span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={downloadProjectsCSV}
              className="text-sm font-medium text-mapbox-gray hover:text-white transition-colors flex items-center gap-2 border border-mapbox-border px-3 py-1.5 rounded-md hover:bg-mapbox-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <span className="text-sm text-mapbox-gray">
              Signed in as <span className="text-white">{user?.email}</span>
            </span>
            <button 
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-mapbox-border">
          <button
            onClick={() => { setActiveTab('pending'); setPage(1); }}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'pending' 
                ? 'border-primary-500 text-primary-500' 
                : 'border-transparent text-mapbox-gray hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => { setActiveTab('all'); setPage(1); }}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'all' 
                ? 'border-primary-500 text-primary-500' 
                : 'border-transparent text-mapbox-gray hover:text-white'
            }`}
          >
            All Projects
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-mapbox-gray uppercase tracking-wider">Total Submissions</h3>
            <p className="text-3xl font-bold text-white mt-2">{total}</p>
          </div>
          <div className="bg-mapbox-card border border-mapbox-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-mapbox-gray uppercase tracking-wider">Pending Action</h3>
            <p className="text-3xl font-bold text-yellow-500 mt-2">
              {activeTab === 'pending' ? total : '...'}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-mapbox-card border border-mapbox-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-mapbox-border">
                <thead className="bg-mapbox-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mapbox-gray uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-mapbox-gray uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mapbox-border">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-mapbox-dark/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{project.projectName}</div>
                        <div className="text-xs text-mapbox-gray">ID: {project.id.slice(0,8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mapbox-gray">
                        {project.organizationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mapbox-gray">
                        {project.city}, {project.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(project.workflowStatus)}`}>
                          {project.workflowStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mapbox-gray">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/projects/${project.id}`}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-mapbox-border flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-mapbox-gray">
              Page {page}
            </span>
            <button
              disabled={projects.length < 20} // Simple check, should use total pages
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-medium text-mapbox-gray hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
