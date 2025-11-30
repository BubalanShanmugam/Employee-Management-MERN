import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role: 'employee' | 'manager') => Promise<void>;
  register: (name: string, email: string, password: string, employeeId: string, department: string, role: 'employee' | 'manager') => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Use sessionStorage - token is automatically cleared when browser/tab is closed
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const login = useCallback(async (email: string, password: string, role: 'employee' | 'manager') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.login({ email, password, loginAs: role });
      // Use sessionStorage - automatically logs out when browser/tab is closed
      sessionStorage.setItem('token', response.token);
      setToken(response.token);
      await fetchUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, employeeId: string, department: string, role: 'employee' | 'manager') => {
    setIsLoading(true);
    setError(null);
    try {
      await api.register({ name, email, password, employeeId, department, role });
      // Registration successful - user will be redirected to login page
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err: any) {
      setError('Failed to fetch user');
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
