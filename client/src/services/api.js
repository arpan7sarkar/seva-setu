import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Only clear stale credentials — do NOT force-navigate.
      // Navigation is handled by React components (ProtectedRoute)
      // which read Clerk's live auth state.
      // The old window.location.assign('/login') was creating an
      // infinite reload loop because it raced with Clerk's token sync.
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    return Promise.reject(error);
  }
);

export default api;
