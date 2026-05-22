import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  getToken,
  getSessionInfo,
  saveSession,
  clearSession,
  loginCompany,
  type LoginRequest,
  type AuthResponse,
} from '../services/authService';

interface SessionInfo {
  email: string;
  role: string;
  companyCode?: string;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  session: SessionInfo | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]     = useState<string | null>(getToken);
  const [session, setSession] = useState<SessionInfo | null>(getSessionInfo);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await loginCompany(data);
    saveSession(res, data.email);
    const tokenData = res.token || (res as any);
    setToken(tokenData.accessToken);
    setSession({
      email: data.email,
      role: tokenData.role || 'user',
      companyCode: res.compCode,
    });
    return res;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, session, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
