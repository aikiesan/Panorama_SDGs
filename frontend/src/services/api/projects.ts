import { apiClient } from './client';

export interface ProjectCreate {
  project_name: string;
  organization_name: string;
  contact_person: string;
  contact_email: string;
  project_status: string;
  uia_region: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  brief_description: string;
  detailed_description: string;
  success_factors: string;
  typologies: string[];
  funding_requirements: string[];
  government_requirements: string[];
  other_requirements: string[];
  other_requirement_text?: string;
  other_typology_text?: string;
  other_funding_text?: string;
  other_gov_text?: string;
  sdgs: number[];
  image_urls: string[];
  captcha_token?: string;
  gdpr_consent: boolean;
}

export const projectsApi = {
  submit: async (data: ProjectCreate) => {
    const response = await apiClient.post('/api/projects/submit', data);
    return response.data;
  },

  getByToken: async (token: string) => {
    const response = await apiClient.get(`/api/projects/edit/${token}`);
    return response.data;
  },

  updateByToken: async (token: string, data: ProjectCreate) => {
    const response = await apiClient.put(`/api/projects/edit/${token}`, data);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/projects/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
