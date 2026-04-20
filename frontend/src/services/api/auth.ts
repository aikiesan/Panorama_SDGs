import { apiClient } from './client';
import type { LoginCredentials, AuthResponse, User } from '../../types';

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Backend expects x-www-form-urlencoded for OAuth2 standard, but our schema uses JSON currently.
    // Let's check backend schema. Assuming JSON for now based on auth.py `UserLogin` model.
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any): Promise<User> => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};
