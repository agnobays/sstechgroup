import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin } from '../types';
import { apiRequest, setStoredToken, getStoredToken } from '../api/client';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentAdmin = async () => {
    const token = getStoredToken();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ admin: Admin }>('/auth/me');
      setAdmin(res.admin);
    } catch (err) {
      setAdmin(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAdmin();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; admin: Admin }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setStoredToken(res.token);
    setAdmin(res.admin);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refresh: fetchCurrentAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
