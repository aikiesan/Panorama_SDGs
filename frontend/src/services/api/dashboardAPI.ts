/**
 * Real Dashboard API - connects to FastAPI backend
 * Replaces mockDashboardAPI.ts with actual API calls
 */

import { apiClient } from './client';
import type {
  Project,
  DashboardKPIs,
  FilterOptions,
} from '../../types';

// Filter dropdown data returned by the backend /filters endpoint
interface FilterData {
  cities: string[];
  regions: string[];
  fundingSources: string[];
}

interface FilterParams {
  region?: string;
  sdg?: number | number[];
  city?: string;
  fundedBy?: string;
  search?: string;
  edition?: string;
}

interface PaginatedResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MapMarker {
  id: string;
  projectName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  region: string;
  status: string;
  fundingNeeded: number;
  primarySdg: number;
  imageUrl?: string;
  category: 'guidebook_2026' | 'guidebook_2023' | 'community' | '2026' | '2023';
}

interface SDGDistribution {
  sdg: number;
  count: number;
}

interface RegionalDistribution {
  region: string;
  fundingNeeded: number;
  fundingSpent: number;
  projectCount: number;
}

interface TypologyDistribution {
  typology: string;
  count: number;
}

export const dashboardAPI = {
  /**
   * Get filter options for dropdowns
   */
  async getFilters(): Promise<FilterData> {
    const response = await apiClient.get('/api/dashboard/filters');

    // Backend returns { cities: [...], fundingSources: [...] }
    // We prepend "All" options for the frontend dropdowns
    return {
      cities: ['All Cities', ...(response.data.cities || [])],
      regions: ['All Regions'],
      fundingSources: ['All', ...(response.data.fundingSources || [])],
    };
  },

  /**
   * Get KPI metrics
   */
  async getKPIs(filters?: FilterOptions, signal?: AbortSignal): Promise<DashboardKPIs> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/kpis', { params, signal });

    // Backend returns snake_case, apiClient converts to camelCase
    return response.data;
  },

  /**
   * Get map markers for map view
   */
  async getMapMarkers(filters?: FilterOptions, signal?: AbortSignal): Promise<MapMarker[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/map-markers', { params, signal });

    return response.data;
  },

  /**
   * Get paginated projects list
   */
  async getProjects(
    filters?: FilterOptions,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse> {
    const params = {
      ...this._buildFilterParams(filters),
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    const response = await apiClient.get('/api/dashboard/projects', { params });

    // Backend returns { total, page, page_size, projects: [...] }
    return response.data;
  },

  /**
   * Get single project by ID (works for approved + guidebook-submitted projects)
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get(`/api/dashboard/projects/${projectId}`);
    return response.data;
  },

  /**
   * Get SDG distribution for analytics
   */
  async getSDGDistribution(filters?: FilterOptions): Promise<SDGDistribution[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/sdg-distribution', {
      params,
    });

    return response.data;
  },

  /**
   * Get regional funding distribution
   */
  async getRegionalDistribution(filters?: FilterOptions): Promise<RegionalDistribution[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/regional-distribution', {
      params,
    });

    return response.data;
  },

  /**
   * Get typology distribution
   */
  async getTypologyDistribution(filters?: FilterOptions): Promise<TypologyDistribution[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/typology-distribution', {
      params,
    });

    return response.data;
  },

  /**
   * Get top countries by project count
   */
  async getCountryDistribution(filters?: FilterOptions): Promise<{ country: string; count: number }[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/country-distribution', { params });
    return response.data;
  },

  /**
   * Get project count by project_status
   */
  async getStatusDistribution(filters?: FilterOptions): Promise<{ status: string; count: number }[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/status-distribution', { params });
    return response.data;
  },

  /**
   * Get project counts by edition (2023 vs 2026)
   */
  async getEditionComparison(filters?: FilterOptions): Promise<{ edition: string; count: number }[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/edition-comparison', { params });
    return response.data;
  },

  /**
   * Get project counts per (region, sdg) for heatmap
   */
  async getSdgRegionHeatmap(filters?: FilterOptions): Promise<{ region: string; sdg: number; count: number }[]> {
    const params = this._buildFilterParams(filters);
    const response = await apiClient.get('/api/dashboard/analytics/sdg-region-heatmap', { params });
    return response.data;
  },

  /**
   * Helper: Build API query parameters from FilterOptions
   * Removes "All" selections and converts to backend format
   */
  _buildFilterParams(filters?: FilterOptions): FilterParams {
    if (!filters) return {};

    const params: FilterParams = {};

    if (filters.region && filters.region !== 'All Regions') {
      params.region = filters.region;
    }

    if (filters.sdgs && filters.sdgs.length > 0) {
      params.sdg = filters.sdgs as any;
    }

    if (filters.city && filters.city !== 'All Cities') {
      params.city = filters.city;
    }

    if (filters.fundedBy && filters.fundedBy !== 'All') {
      params.fundedBy = filters.fundedBy;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.edition && filters.edition !== 'all') {
      params.edition = filters.edition;
    }

    if (filters.showSubmissions) {
      (params as any).show_submissions = true;
    }

    return params;
  },
};
