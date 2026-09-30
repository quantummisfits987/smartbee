import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, loginUser, registerUser, getCurrentUser, RegisterPayload, LoginPayload } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('smartbee_token');
      const storedUser = localStorage.getItem('smartbee_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token validity with backend
          const res = await getCurrentUser();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('smartbee_user', JSON.stringify(res.user));
          }
        } catch (err) {
          // Token expired or invalid
          console.warn('[AuthContext] Session invalid or expired:', err);
          localStorage.removeItem('smartbee_token');
          localStorage.removeItem('smartbee_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await loginUser(payload);
    if (res.success && res.token && res.user) {
      localStorage.setItem('smartbee_token', res.token);
      localStorage.setItem('smartbee_user', JSON.stringify(res.user));
      setUser(res.user);
    }
  };

  const register = async (payload: RegisterPayload) => {
    await registerUser(payload);
  };

  const logout = () => {
    localStorage.removeItem('smartbee_token');
    localStorage.removeItem('smartbee_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
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
