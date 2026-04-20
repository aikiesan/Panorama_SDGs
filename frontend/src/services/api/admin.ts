import { apiClient } from './client';
import type { Project, ProjectSubmission } from '../../types';

export interface PaginatedProjects {
  total: number;
  page: number;
  page_size: number;
  projects: Project[];
}

export const adminAPI = {
  // Get pending projects
  getPendingProjects: async (page = 1, pageSize = 20): Promise<PaginatedProjects> => {
    const response = await apiClient.get(`/api/admin/pending-projects?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Get all projects (filtered by status if needed)
  getAllProjects: async (
    page = 1,
    pageSize = 20,
    workflowStatus?: string
  ): Promise<PaginatedProjects> => {
    let url = `/api/admin/all-projects?page=${page}&page_size=${pageSize}`;
    if (workflowStatus) {
      url += `&workflow_status=${workflowStatus}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get full project details
  getProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/api/admin/projects/${projectId}`);
    return response.data;
  },

  // Update project
  updateProject: async (projectId: string, data: Partial<ProjectSubmission>): Promise<Project> => {
    const response = await apiClient.patch(`/api/admin/projects/${projectId}`, data);
    return response.data;
  },

  // Approve project
  approveProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.post(`/api/admin/projects/${projectId}/approve`);
    return response.data;
  },

  // Reject project
  rejectProject: async (projectId: string, reason: string): Promise<void> => {
    await apiClient.post(`/api/admin/projects/${projectId}/reject`, { reason });
  },

  // Request changes
  requestChanges: async (projectId: string, message: string): Promise<void> => {
    await apiClient.post(`/api/admin/projects/${projectId}/request-changes`, { message });
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/projects/${projectId}`);
  },
};
