import { apiClient } from './client';
import type { Project, DashboardKPIs, FilterOptions } from '../../types';

export const dashboardAPI = {
  // Get available filters (cities, funding sources)
  getFilters: async () => {
    const response = await apiClient.get('/api/dashboard/filters');
    return response.data;
  },

  // Get KPIs
  getKPIs: async (filters?: FilterOptions): Promise<DashboardKPIs> => {
    const params = new URLSearchParams();
    if (filters?.region && filters.region !== 'All Regions') {
      params.append('region', filters.region);
    }
    if (filters?.sdg && filters.sdg !== 'All SDGs') {
      params.append('sdg', filters.sdg.toString());
    }
    if (filters?.city && filters.city !== 'All Cities') {
      params.append('city', filters.city);
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/kpis?${params.toString()}`);
    return response.data;
  },

  // Get map markers
  getMapMarkers: async (filters?: FilterOptions) => {
    const params = new URLSearchParams();
    if (filters?.region && filters.region !== 'All Regions') {
      params.append('region', filters.region);
    }
    if (filters?.sdg && filters.sdg !== 'All SDGs') {
      params.append('sdg', filters.sdg.toString());
    }
    if (filters?.city && filters.city !== 'All Cities') {
      params.append('city', filters.city);
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/map-markers?${params.toString()}`);
    return response.data;
  },

  // Get projects list
  getProjects: async (
    filters?: FilterOptions,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);

    if (filters?.region && filters.region !== 'All Regions') {
      params.append('region', filters.region);
    }
    if (filters?.sdg && filters.sdg !== 'All SDGs') {
      params.append('sdg', filters.sdg.toString());
    }
    if (filters?.city && filters.city !== 'All Cities') {
      params.append('city', filters.city);
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/projects?${params.toString()}`);
    return response.data;
  },

  // Get single project
  getProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/api/projects/${projectId}`);
    return response.data;
  },

  // Get analytics data
  getSDGDistribution: async (filters?: FilterOptions) => {
    const params = new URLSearchParams();
    if (filters?.region && filters.region !== 'All Regions') {
      params.append('region', filters.region);
    }
    if (filters?.city && filters.city !== 'All Cities') {
      params.append('city', filters.city);
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/analytics/sdg-distribution?${params.toString()}`);
    return response.data;
  },

  getRegionalDistribution: async (filters?: FilterOptions) => {
    const params = new URLSearchParams();
    if (filters?.sdg && filters.sdg !== 'All SDGs') {
      params.append('sdg', filters.sdg.toString());
    }
    if (filters?.city && filters.city !== 'All Cities') {
      params.append('city', filters.city);
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/analytics/regional-distribution?${params.toString()}`);
    return response.data;
  },

  getTypologyDistribution: async (filters?: FilterOptions) => {
    const params = new URLSearchParams();
    if (filters?.region && filters.region !== 'All Regions') {
      params.append('region', filters.region);
    }
    if (filters?.sdg && filters.sdg !== 'All SDGs') {
      params.append('sdg', filters.sdg.toString());
    }
    if (filters?.fundedBy && filters.fundedBy !== 'All') {
      params.append('funded_by', filters.fundedBy);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get(`/api/dashboard/analytics/typology-distribution?${params.toString()}`);
    return response.data;
  },
};