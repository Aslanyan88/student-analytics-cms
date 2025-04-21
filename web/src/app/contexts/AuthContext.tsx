'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// User types
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Register data type
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  inviteToken?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize axios with base URL
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
  });

  // Set up axios interceptor for authentication
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Add token to headers if available
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 Unauthorized error
        if (error.response && error.response.status === 401) {
          logout();
          router.push('/login');
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, router]);

  // Load user from local storage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Error loading user from localStorage:', err);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
 // contexts/AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      email,
      password
    });

    const { user, token } = response.data;

    // Log successful login (for debugging)
    console.log('Login successful, token received');

    // Save to state and local storage
    setUser(user);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);

    // Redirect based on role
    redirectBasedOnRole(user.role);
  } catch (err: any) {
    console.error('Login error:', err);
    setError(err.response?.data?.message || 'An error occurred during login');
  } finally {
    setLoading(false);
  }
};
  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      // Determine registration endpoint based on inviteToken presence
      const endpoint = userData.inviteToken
        ? '/api/auth/register-student'
        : '/api/auth/register';

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        userData
      );

      const { user, token } = response.data;

      // Save to state and local storage
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Redirect based on role
      redirectBasedOnRole(user.role);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state and local storage
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login page
    router.push('/login');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Redirect based on user role
  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        router.push('/dashboard/admin');
        break;
      case 'TEACHER':
        router.push('/dashboard/teacher');
        break;
      case 'STUDENT':
        router.push('/dashboard/student');
        break;
      default:
        router.push('/dashboard');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};