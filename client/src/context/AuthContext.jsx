import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if session cookie exists by calling /auth/me
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 unauthenticated response or network error
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login action
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      throw new Error(response.data?.message || 'Login failed');
    } catch (err) {
      const message = err.message || 'Invalid email or password';
      setAuthError(message);
      throw new Error(message);
    }
  };

  // Register action (always creates student role)
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      throw new Error(response.data?.message || 'Registration failed');
    } catch (err) {
      const message = err.message || 'Registration failed';
      setAuthError(message);
      throw new Error(message);
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error (clearing local state anyway):', err);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
