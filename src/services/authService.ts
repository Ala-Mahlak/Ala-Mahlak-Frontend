// Relative path → Vite proxy forwards to https://ala-mahlak.runasp.net in dev.
// In production build, set this to 'https://ala-mahlak.runasp.net/api'
const BASE_URL = '/api';

// ─── Request types ──────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterDriverRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ─── Response types ─────────────────────────────────────────────────────────

export interface TokenPayload {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  role: string;
}

// Shared token-envelope (used by both Login & Register)
export interface AuthResponse {
  message: string;
  token: TokenPayload;
  compCode?: string;
}

export interface SessionInfo {
  name?: string;
  email: string;
  role: string;
  companyCode?: string;
  profilePhoto?: string;
  phoneNumber?: string;
}

// ─── Session keys ──────────────────────────────────────────────────────────

const TOKEN_KEY   = 'ala_mahlak_token';
const COMPANY_KEY = 'ala_mahlak_company';
const PROFILE_PREFIX = 'ala_mahlak_profile_';

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    // Try to pull the most useful error message from the response
    const msg = isJson
      ? body?.message || body?.title || Object.values(body?.errors ?? {}).flat().join(', ')
      : body;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return body as T;
}

function post<T>(path: string, data: unknown): Promise<T> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => handleResponse<T>(r));
}

function authenticatedGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  }).then(r => handleResponse<T>(r));
}

function authenticatedPost<T>(path: string, data: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  }).then(r => handleResponse<T>(r));
}

function authenticatedPut<T>(path: string, data?: unknown, isFormData = false): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: isFormData ? (data as FormData | undefined) : (data === undefined ? undefined : JSON.stringify(data)),
  }).then(r => handleResponse<T>(r));
}

function authenticatedDelete<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  }).then(r => handleResponse<T>(r));
}

// ─── Admin authentication ─────────────────────────────────────────────────

/** Response from /api/auth/login (flat, not nested under token) */
export interface AdminLoginResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  role: string;
  compCode: string | null;
}

/** Normalize admin flat response to the standard AuthResponse shape */
function normalizeAdminLoginToAuthResponse(res: AdminLoginResponse): AuthResponse {
  return {
    message: 'Admin login successful',
    token: {
      accessToken: res.accessToken,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      refreshToken: res.refreshToken,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
      role: res.role,
    },
    compCode: res.compCode ?? undefined,
  };
}

/** POST /api/auth/login */
export function loginAdmin(data: AdminLoginRequest): Promise<AuthResponse> {
  return post<AdminLoginResponse>('/auth/login', data).then(normalizeAdminLoginToAuthResponse);
}

/** Check if admin role indicates approved account.
 *  "User"  = pending approval.
 *  "Admin" or "Super trabaj  Admin" = approved. */
export function isAdminApproved(role: string): boolean {
  return role === 'Admin' || role === 'SuperAdmin';
}

/** Response from /api/auth/register (also flat) */
export interface AdminLoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface AdminRegisterRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface AdminRegisterResponse {
  message: string;
  token: AdminLoginResponse; // same shape
}

function normalizeAdminRegisterToAuthResponse(res: AdminRegisterResponse): AuthResponse {
  return {
    message: res.message,
    token: {
      accessToken: res.token.accessToken,
      accessTokenExpiresAt: res.token.accessTokenExpiresAt,
      refreshToken: res.token.refreshToken,
      refreshTokenExpiresAt: res.token.refreshTokenExpiresAt,
      role: res.token.role,
    },
    compCode: res.token.compCode ?? undefined,
  };
}

/** POST /api/auth/register */
export function registerAdmin(data: AdminRegisterRequest): Promise<AuthResponse> {
  return post<AdminRegisterResponse>('/auth/register', data).then(normalizeAdminRegisterToAuthResponse);
}

// ─── Driver types ──────────────────────────────────────────────────────────

export type DriverStatus = 'active' | 'break' | 'offline';

export interface CompanyDriver {
  id: number;
  name: string;
  profilePhoto?: string;
  email: string;
  phoneNumber: string;
  compCode: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  compCode: string;
  userId: number;
  userName: string;
  userProfilePhoto?: string;
  userEmail: string;
  userPhoneNumber: string;
  approved: boolean;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}

export interface PromoteAdminRequest {
  userId: number;
}

export interface CompanyLogoRequest {
  logoFile?: File | null;
  removeLogo?: boolean;
}

export interface UpdateCompanyProfileRequest {
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface UpdateAdminProfileRequest {
  name: string;
  email?: string;
  phoneNumber?: string;
  profilePhoto?: File | null;
  removePhoto?: boolean;
}

export interface CompanyReportQuery {
  startDate?: string;
  endDate?: string;
}

export function getJoinRequests(): Promise<JoinRequest[]> {
  return authenticatedGet<JoinRequest[]>('/companies/join-requests');
}

export function decideJoinRequest(requestId: string | number, decision: 'accept' | 'reject'): Promise<{ message: string }> {
  return authenticatedPut<{ message: string }>('/companies/join-requests/decision', {
    requestId: typeof requestId === 'string' ? parseInt(requestId, 10) : requestId,
    approved: decision === 'accept',
  });
}

export function getCompanyDrivers(): Promise<CompanyDriver[]> {
  return authenticatedGet<CompanyDriver[]>('/companies/drivers');
}



export interface CompanyTrip {
  id: number;
  driverId: number;
  driverName: string;
  driverEmail: string;
  driverPhoneNumber: string;
  compCode: string;
  startTime: string;
  endTime?: string;
  distanceKm: number;
  origin: string;
  destination: string;
  rating: number;
  totalAlerts: number;
  highestSpeedKmH: number;
}

export function getCompanyTrips(): Promise<CompanyTrip[]> {
  return authenticatedGet<CompanyTrip[]>('/companies/trips');
}

export interface CompanyAdmin {
  id: number;
  name: string;
  profilePhoto?: string | null;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
}

export function getCompanyAdmins(search?: string): Promise<CompanyAdmin[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return authenticatedGet<CompanyAdmin[]>(`/companies/admins${query}`);
}

export function createCompanyAdmin(data: CreateAdminRequest): Promise<{ message?: string }> {
  return authenticatedPost<{ message?: string }>('/companies/admins', data);
}

export function getCompanyAdminCandidates(): Promise<unknown> {
  return authenticatedGet<unknown>('/companies/admin-candidates');
}

export function promoteCompanyAdmin(data: PromoteAdminRequest): Promise<{ message?: string }> {
  return authenticatedPost<{ message?: string }>('/companies/admins/promote', data);
}

export function downgradeCompanyAdmin(userId: number): Promise<{ message?: string }> {
  return authenticatedPut<{ message?: string }>(`/companies/admins/${userId}/downgrade`);
}

export function removeCompanyMember(userId: number): Promise<{ message?: string }> {
  return authenticatedDelete<{ message?: string }>(`/companies/members/${userId}`);
}

export function updateCompanyLogo(data: CompanyLogoRequest): Promise<{ message?: string }> {
  const formData = new FormData();

  if (data.logoFile) {
    formData.append('Logo', data.logoFile);
  }

  formData.append('RemoveLogo', String(Boolean(data.removeLogo)));

  return authenticatedPut<{ message?: string }>('/companies/logo', formData, true);
}

export function updateCompanyProfile(data: UpdateCompanyProfileRequest): Promise<{ message: string }> {
  return authenticatedPut<{ message: string }>('/companies/profile', data);
}

export function updateAdminProfile(data: UpdateAdminProfileRequest): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.email) formData.append('email', data.email);
  if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
  if (data.profilePhoto) formData.append('profilePhoto', data.profilePhoto);
  if (data.removePhoto) formData.append('removePhoto', 'true');
  return authenticatedPut<{ message: string }>('/auth/admin/profile', formData, true);
}

export function getCompanyDriverReport(query: CompanyReportQuery): Promise<unknown> {
  const params = new URLSearchParams();

  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return authenticatedGet<unknown>(`/companies/reports/drivers${suffix}`);
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

/** POST /api/Companies/Login */
export function loginCompany(data: LoginRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/company/Login', data);
}

/** POST /api/auth/company/register */
export function registerCompany(data: RegisterRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/company/register', data);
}

/** POST /api/Companies/ForgotPassword */
export function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/Companies/ForgotPassword', data);
}

/** POST /api/Companies/VerifyOtp */
export function verifyOtp(data: VerifyOtpRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/Companies/VerifyOtp', data);
}

/** POST /api/Companies/ResetPassword */
export function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  return post<{ message: string }>('/Companies/ResetPassword', data);
}

/** POST /api/auth/logout */
export function logoutCompany(): Promise<{ message: string }> {
  return authenticatedPost<{ message: string }>('/auth/logout', {});
}

/** POST /api/companies/drivers */
export function registerDriver(data: RegisterDriverRequest): Promise<{ message: string }> {
  return authenticatedPost<{ message: string }>('/companies/drivers', data);
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export function saveSession(res: AuthResponse, profile?: Partial<Pick<SessionInfo, 'name' | 'email' | 'profilePhoto'>>) {
  // Handle different response structures
  const tokenData = res.token ?? (res as unknown as TokenPayload);
  
  if (!tokenData?.accessToken) {
    console.error('Invalid response structure:', res);
    throw new Error('Invalid login response: missing accessToken');
  }

  localStorage.setItem(TOKEN_KEY, tokenData.accessToken);
  const existing = getSessionInfo();
  const profileKey = getProfileStorageKey({ email: profile?.email ?? existing?.email ?? '', companyCode: res.compCode ?? existing?.companyCode });
  const persistedProfile = getPersistedProfile(profileKey);
  const stored: SessionInfo = {
    name: profile?.name ?? persistedProfile?.name ?? existing?.name,
    email: profile?.email ?? existing?.email ?? '',
    role: tokenData.role || 'user',
    companyCode: res.compCode || undefined,
    profilePhoto: profile?.profilePhoto ?? persistedProfile?.profilePhoto ?? existing?.profilePhoto,
  };
  localStorage.setItem(COMPANY_KEY, JSON.stringify(stored));
  persistProfile(stored);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(COMPANY_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionInfo(): SessionInfo | null {
  const raw = localStorage.getItem(COMPANY_KEY);
  return raw ? JSON.parse(raw) : null;
}

function getProfileStorageKey(session: Pick<SessionInfo, 'email' | 'companyCode'> | null | undefined) {
  return `${PROFILE_PREFIX}${session?.companyCode ?? session?.email ?? 'unknown'}`;
}

function persistProfile(session: SessionInfo) {
  localStorage.setItem(getProfileStorageKey(session), JSON.stringify(session));
}

function getPersistedProfile(key: string): SessionInfo | null {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export function getPersistedProfileInfo(session: Pick<SessionInfo, 'email' | 'companyCode'> | null | undefined): SessionInfo | null {
  return getPersistedProfile(getProfileStorageKey(session));
}

export function savePersistedProfile(session: SessionInfo) {
  persistProfile(session);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
