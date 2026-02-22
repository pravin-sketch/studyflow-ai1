// API Configuration — uses env var in production, localhost in dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE = API_BASE_URL;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  SIGNUP: `${API_BASE_URL}/signup`,
  PROFILE: `${API_BASE_URL}/users/profile`,
};
