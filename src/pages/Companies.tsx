import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CirclePlus,
  Download,
  KeyRound,
  Loader2,
  PencilLine,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import {
  createCompanyAdmin,
  downgradeCompanyAdmin,
  getCompanyAdminCandidates,
  getCompanyAdmins,
  getCompanyDriverReport,
  promoteCompanyAdmin,
  removeCompanyMember,
  updateCompanyLogo,
} from '../services/authService';
import type { CompanyAdmin } from '../services/authService';

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeList = (value: unknown): RecordValue[] => {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (isRecord(value)) {
    for (const key of ['items', 'data', 'results', 'value']) {
      const candidate = value[key];
      if (Array.isArray(candidate)) {
        return candidate.filter(isRecord);
      }
    }
  }

  return [];
};

const toText = (value: unknown, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback;
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'string') return value;
  return fallback;
};

const getId = (row: RecordValue) => {
  const candidate = row.userId ?? row.id ?? row.adminId ?? row.memberId;
  const id = typeof candidate === 'number' ? candidate : Number(candidate);
  return Number.isFinite(id) ? id : null;
};

const getDisplayName = (row: RecordValue) =>
  toText(row.name ?? row.fullName ?? row.userName ?? row.driverName ?? row.email ?? row.title);

const getEmail = (row: RecordValue) => toText(row.email ?? row.userEmail);

const getRole = (row: RecordValue) => toText(row.role ?? row.type ?? row.position);

const getDateInputValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const buildDateTime = (value: string) => `${value}T00:00:00.000Z`;

export default function Companies() {
  const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
  const [candidates, setCandidates] = useState<RecordValue[]>([]);
  const [reportRows, setReportRows] = useState<RecordValue[]>([]);
  const [search, setSearch] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [reportStart, setReportStart] = useState(getDateInputValue(-30));
  const [reportEnd, setReportEnd] = useState(getDateInputValue());
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });

  const adminColumns = useMemo(() => {
    return ['name', 'email', 'createdAt'];
  }, []);

  const candidateColumns = useMemo(() => {
    const sample = candidates[0];
    if (!sample) return [];
    return Array.from(new Set(['name', 'email', 'role', ...Object.keys(sample)])).slice(0, 5);
  }, [candidates]);

  const reportColumns = useMemo(() => {
    const sample = reportRows[0];
    if (!sample) return [];
    return Array.from(new Set(Object.keys(sample))).slice(0, 8);
  }, [reportRows]);

  const loadAdmins = useCallback(async (query = search) => {
    setLoadingAdmins(true);
    setAdminsError(null);
    try {
      const response = await getCompanyAdmins(query.trim() || undefined);
      setAdmins(response);
    } catch (error) {
      setAdminsError(error instanceof Error ? error.message : 'Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  }, [search]);

  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const response = await getCompanyAdminCandidates();
      setCandidates(normalizeList(response));
    } catch (error) {
      setCandidatesError(error instanceof Error ? error.message : 'Failed to load admin candidates');
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    setReportError(null);
    try {
      const response = await getCompanyDriverReport({
        startDate: buildDateTime(reportStart),
        endDate: buildDateTime(reportEnd),
      });
      setReportRows(normalizeList(response));
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Failed to load driver report');
    } finally {
      setLoadingReport(false);
    }
  }, [reportStart, reportEnd]);

  useEffect(() => {
    loadAdmins('');
  }, [loadAdmins]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadAdmins(search);
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateBusy(true);
    setAdminsError(null);
    try {
      await createCompanyAdmin(createForm);
      setCreateForm({ name: '', email: '', password: '' });
      await loadAdmins(search);
    } catch (error) {
      setAdminsError(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setCreateBusy(false);
    }
  };

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setPendingAction(key);
    try {
      await action();
      await Promise.all([loadAdmins(search), loadCandidates()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      setAdminsError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogoUpload = async () => {
    setLogoBusy(true);
    setAdminsError(null);
    try {
      await updateCompanyLogo({ logoFile: selectedLogo, removeLogo });
      setSelectedLogo(null);
      setRemoveLogo(false);
    } catch (error) {
      setAdminsError(error instanceof Error ? error.message : 'Failed to update company logo');
    } finally {
      setLogoBusy(false);
    }
  };

  const adminCount = admins.length;
  const candidateCount = candidates.length;
  const reportCount = reportRows.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <ShieldCheck size={16} className="text-indigo-600" />
            Admins
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{adminCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Users size={16} className="text-amber-600" />
            Candidates
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{candidateCount}</div>
          <div className="text-xs text-slate-500">Ready for promotion</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Download size={16} className="text-emerald-600" />
            Report rows
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{reportCount}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Admin Management</h2>
              <p className="text-sm text-slate-500">Search, create, promote, downgrade, or remove company admins.</p>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search admins"
                  className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                Filter
              </button>
            </form>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <form onSubmit={handleCreateAdmin} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CirclePlus size={15} className="text-indigo-600" />
                Create Admin
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={createForm.name}
                  onChange={event => setCreateForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Admin name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  value={createForm.email}
                  onChange={event => setCreateForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="admin@company.com"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  value={createForm.password}
                  onChange={event => setCreateForm(prev => ({ ...prev, password: event.target.value }))}
                  placeholder="Temporary password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  disabled={createBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createBusy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  {createBusy ? 'Creating...' : 'Add Admin'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Company Logo</div>
                  <p className="text-xs text-slate-500">Upload or remove the company logo via /api/companies/logo.</p>
                </div>
                <Upload size={16} className="text-slate-400" />
              </div>
              <div className="mt-4 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => setSelectedLogo(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={removeLogo}
                    onChange={event => setRemoveLogo(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remove existing logo
                </label>
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={logoBusy || (!selectedLogo && !removeLogo)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logoBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {logoBusy ? 'Saving...' : 'Update Logo'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Admins from API
            </div>
            {loadingAdmins ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading admins...</div>
            ) : adminsError ? (
              <div className="p-8 text-center text-sm text-rose-600">{adminsError}</div>
            ) : admins.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No admins returned by the API.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Admin</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(row => {
                      const id = getId(row);
                      return (
                        <tr key={id ?? getDisplayName(row)} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <div className="flex items-center gap-3">
                              {row.profilePhoto ? (
                                <img src={row.profilePhoto} alt={row.name} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {row.name?.split(' ').map(p => p[0] ?? '').join('').slice(0,2).toUpperCase()}
                                </div>
                              )}
                              <div>{row.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.email}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                disabled={id === null || pendingAction === `downgrade-${id}`}
                                onClick={() => id !== null && runAction(`downgrade-${id}`, () => downgradeCompanyAdmin(id))}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <PencilLine size={13} />
                                Downgrade
                              </button>
                              <button
                                type="button"
                                disabled={id === null || pendingAction === `remove-${id}`}
                                onClick={() => id !== null && runAction(`remove-${id}`, () => removeCompanyMember(id))}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Admin Candidates</h2>
                <p className="text-sm text-slate-500">Promote eligible members into the admin list.</p>
              </div>
              <Users size={18} className="text-amber-600" />
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-auto pr-2">
              {loadingCandidates ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading candidates...</div>
              ) : candidatesError ? (
                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600">{candidatesError}</div>
              ) : candidates.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No candidates found.</div>
              ) : (
                candidates.map(row => {
                  const id = getId(row);
                  return (
                    <div key={id ?? getDisplayName(row)} className="rounded-2xl border border-slate-200 p-4 overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">{getDisplayName(row)}</div>
                          <div className="text-sm text-slate-500">{getEmail(row)}</div>
                          <div className="text-xs text-slate-400 mt-2">{getRole(row)}</div>
                        </div>
                        <button
                          type="button"
                          disabled={id === null || pendingAction === `candidate-promote-${id}`}
                          onClick={() => id !== null && runAction(`candidate-promote-${id}`, () => promoteCompanyAdmin({ userId: id }))}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingAction === `candidate-promote-${id}` ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                          Promote
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Driver Reports</h2>
                <p className="text-sm text-slate-500">Query /api/companies/reports/drivers with a date range.</p>
              </div>
              <Download size={18} className="text-emerald-600" />
            </div>

            <div className="mt-4 grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Start date</label>
              <input
                type="date"
                value={reportStart}
                onChange={event => setReportStart(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">End date</label>
              <input
                type="date"
                value={reportEnd}
                onChange={event => setReportEnd(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={loadReport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Download size={14} />
                Fetch report
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              {loadingReport ? (
                <div className="p-6 text-center text-sm text-slate-500">Loading report...</div>
              ) : reportError ? (
                <div className="p-6 text-center text-sm text-rose-600">{reportError}</div>
              ) : reportRows.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No report rows returned.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        {reportColumns.map(column => (
                          <th key={column} className="px-4 py-3 text-left">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          {reportColumns.map(column => (
                            <td key={column} className="px-4 py-3 text-slate-600">
                              {toText(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Candidate schema preview</h3>
          <p className="mt-1 text-sm text-slate-500">Useful when the API returns additional fields you want to surface later.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {candidateColumns.length > 0 ? candidateColumns.map(column => (
              <span key={column} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{column}</span>
            )) : <span className="text-sm text-slate-500">No candidate fields available yet.</span>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Admin schema preview</h3>
          <p className="mt-1 text-sm text-slate-500">The page preserves unknown API fields instead of dropping them.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {adminColumns.length > 0 ? adminColumns.map(column => (
              <span key={column} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{column}</span>
            )) : <span className="text-sm text-slate-500">No admin fields available yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}