import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper methods for API calls
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((response: AxiosResponse<T>) => response.data),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((response: AxiosResponse<T>) => response.data),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((response: AxiosResponse<T>) => response.data),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((response: AxiosResponse<T>) => response.data),
};

// Auth-specific API calls
export const authApi = {
  login: (email: string, password: string) =>
    apiService.post('/api/auth/login', { email, password }),
  register: (userData: any) =>
    apiService.post('/api/auth/register', userData),
  forgotPassword: (email: string) =>
    apiService.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiService.post(`/api/auth/reset-password/${token}`, { password }),
  getProfile: () => apiService.get('/api/auth/me'),
};

// Classroom API calls
export const classroomApi = {
  getAll: ( ) => apiService.get('/api/classrooms'),
  getById: (id: string) => apiService.get(`/api/classrooms/${id}`),
  create: (data: any) => apiService.post('/api/classrooms', data),
  update: (id: string, data: any) => apiService.put(`/api/classrooms/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/classrooms/${id}`),
  addTeacher: (classroomId: string, data: any) =>
    apiService.post(`/api/classrooms/${classroomId}/teachers`, data),
  addStudent: (classroomId: string, data: any) =>
    apiService.post(`/api/classrooms/${classroomId}/students`, data),
  removeTeacher: (classroomId: string, teacherId: string) =>
    apiService.delete(`/api/classrooms/${classroomId}/teachers/${teacherId}`),
  removeStudent: (classroomId: string, studentId: string) =>
    apiService.delete(`/api/classrooms/${classroomId}/students/${studentId}`),
};

// User API calls
export const userApi = {
  getAll: () => apiService.get('/api/users'),
  getById: (id: string) => apiService.get(`/api/users/${id}`),
  update: (id: string, data: any) => apiService.put(`/api/users/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/users/${id}`),
};

// Admin API calls
export const adminApi = {
  getDashboardStats: () => apiService.get<any>('/api/admin/dashboard'),
  getSystemStats:   () => apiService.get<any>('/api/admin/system-stats'),
  // Add more admin-specific endpoints as needed
};

export default api;
