import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  getSessionInfo,
  getPersistedProfileInfo,
  saveSession,
  savePersistedProfile,
  clearSession as clearAuthSession,
  loginCompany,
  loginAdmin as loginAdminAPI,
  isAdminApproved,
  getToken as getAuthToken,
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
  phoneNumber?: string;
}

interface AuthContextValue {
  isLoggedIn: boolean;
  session: SessionInfo | null;
  token: string | null;
  userType: 'company' | 'admin' | null;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  loginAdmin: (data: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
  updateSession: (updates: Partial<SessionInfo>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_TYPE_KEY = 'ala_mahlak_user_type';
const COMPANY_KEY = 'ala_mahlak_company';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [userType, setUserType] = useState<'company' | 'admin' | null>(null);

  // Restore session on mount
  useEffect(() => {
    const storedToken = getAuthToken();
    const storedUserType = localStorage.getItem(USER_TYPE_KEY) as 'company' | 'admin' | null;
    const storedSession = getSessionInfo();
    
    if (storedToken && storedSession && storedUserType) {
      setToken(storedToken);
      setSession(storedSession);
      setUserType(storedUserType);
    }
  }, []);

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
    setUserType('company');
    localStorage.setItem(USER_TYPE_KEY, 'company');
    return res;
  }, []);

  const loginAdmin = useCallback(async (data: LoginRequest) => {
    // Map email → emailOrPhone to match backend API contract
    const res = await loginAdminAPI({ emailOrPhone: data.email, password: data.password });
    
    // Check if admin is approved - "User" role means pending approval
    if (!isAdminApproved(res.token.role)) {
      throw new Error(
        'Your admin account is pending approval. Please wait for a SuperAdmin to approve your account.'
      );
    }
    
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
    setUserType('admin');
    localStorage.setItem(USER_TYPE_KEY, 'admin');
    return res;
  }, []);

  const updateSession = useCallback((updates: Partial<SessionInfo>) => {
    setSession(prev => {
      const next = { ...(prev ?? getSessionInfo() ?? { email: '', role: 'user' }), ...updates };
      localStorage.setItem(COMPANY_KEY, JSON.stringify(next));
      savePersistedProfile(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    localStorage.removeItem(USER_TYPE_KEY);
    setToken(null);
    setSession(null);
    setUserType(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, session, token, userType, login, loginAdmin, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
