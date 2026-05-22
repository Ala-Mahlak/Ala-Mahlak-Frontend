import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  getToken,
  getSessionInfo,
  getPersistedProfileInfo,
  saveSession,
  savePersistedProfile,
  clearSession,
  loginCompany,
  type LoginRequest,
  type AuthResponse,
  type SessionInfo as StoredSessionInfo,
} from '../services/authService';

interface SessionInfo {
  name?: string;
  email: string;
  role: string;
  companyCode?: string;
  profilePhoto?: string;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  session: SessionInfo | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
  updateSession: (updates: Partial<SessionInfo>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]     = useState<string | null>(getToken);
  const [session, setSession] = useState<SessionInfo | null>(() => {
    const storedSession = getSessionInfo();
    const persistedProfile = getPersistedProfileInfo(storedSession);
    return persistedProfile ? { ...storedSession, ...persistedProfile } : storedSession;
  });

  const login = useCallback(async (data: LoginRequest) => {
    const res = await loginCompany(data);
    saveSession(res, { email: data.email });
    const tokenData = res.token ?? (res as unknown as StoredSessionInfo & { accessToken: string; role?: string });
    setToken(tokenData.accessToken);
    const storedSession = getSessionInfo() as StoredSessionInfo | null;
    const persistedProfile = getPersistedProfileInfo(storedSession);
    const nextSession = {
      ...(storedSession ?? {}),
      ...(persistedProfile ?? {}),
      email: data.email,
      role: 'role' in tokenData && tokenData.role ? tokenData.role : 'user',
      companyCode: res.compCode,
    };
    setSession(nextSession);
    return res;
  }, []);

  const updateSession = useCallback((updates: Partial<SessionInfo>) => {
    setSession(prev => {
      const next = { ...(prev ?? getSessionInfo() ?? { email: '', role: 'user' }), ...updates };
      localStorage.setItem('ala_mahlak_company', JSON.stringify(next));
      savePersistedProfile(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, session, token, login, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
