import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Check, FileText, CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getJoinRequests, decideJoinRequest, addManualDriver } from '../services/authService';
import type { JoinRequest } from '../services/authService';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../context/NotificationContext';

export default function AssignDrivers() {
  const { addNotification } = useNotifications();
  const [copied, setCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const { session } = useAuth();
  const [companyCode, setCompanyCode] = useState<string | null>(session?.companyCode ?? null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    vehicleId: '',
    status: 'active',
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const queryClient = useQueryClient();

  const handleCopy = () => {
    if (!companyCode) return;
    navigator.clipboard.writeText(companyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCompanyCode = (session?.companyCode ?? companyCode ?? '').trim() || null;
  const visibleJoinRequests = useMemo(() => {
    if (!activeCompanyCode) return [];

    const normalizedCompanyCode = activeCompanyCode.trim().toLowerCase();
    return joinRequests.filter(request => (request.compCode ?? '').trim().toLowerCase() === normalizedCompanyCode);
  }, [activeCompanyCode, joinRequests]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    setAssignSuccess(false);

    if (!formData.fullName.trim()) {
      setAssignError('Full Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setAssignError('Email Address is required');
      return;
    }
    if (!formData.phone.trim()) {
      setAssignError('Phone Number is required');
      return;
    }
    if (!activeCompanyCode) {
      setAssignError('No active company code found. Please ensure you are logged in as a company.');
      return;
    }

    setAssignLoading(true);
    try {
      const driverName = formData.fullName.trim();
      await addManualDriver({
        name: driverName,
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        compCode: activeCompanyCode,
      });

      await queryClient.invalidateQueries({ queryKey: ['company-drivers'] });

      addNotification(
        'assignment',
        'New Driver Assigned',
        `Driver ${driverName} has been manually assigned to the fleet.`
      );

      setAssignSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', license: '', vehicleId: '', status: 'active' });
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign driver');
    } finally {
      setAssignLoading(false);
    }
  };

  const loadJoinRequests = useCallback(async () => {
    setLoadingRequests(true);
    setRequestsError(null);

    try {
      const requests = await getJoinRequests();
      if (!activeCompanyCode) {
        setJoinRequests([]);
        return;
      }

      const normalizedCompanyCode = activeCompanyCode.toLowerCase();
      const filtered = requests.filter(
        request => (request.compCode ?? '').trim().toLowerCase() === normalizedCompanyCode
      );

      const normalized = filtered.map(req => {
        let status = req.status || 'Pending';
        if (req.approved) {
          status = 'Approved';
        } else if (status.toLowerCase() === 'accepted') {
          status = 'Approved';
        }
        return {
          ...req,
          status,
        };
      });

      setJoinRequests(normalized);
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : 'Failed to load pending requests');
    } finally {
      setLoadingRequests(false);
    }
  }, [activeCompanyCode]);

  const handleDecision = async (requestId: string, decision: 'accept' | 'reject') => {
    setPendingActionId(requestId);
    try {
      const reqInfo = joinRequests.find(r => r.id === requestId);
      const driverName = reqInfo ? reqInfo.userName : 'A driver';

      await decideJoinRequest(requestId, decision);
      setJoinRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: decision === 'accept' ? 'Approved' : 'Rejected', approved: decision === 'accept' }
            : request
        )
      );

      addNotification(
        decision === 'accept' ? 'assignment' : 'alert',
        decision === 'accept' ? 'Join Request Approved' : 'Join Request Rejected',
        `Driver ${driverName}'s request to join the company was ${decision}ed.`
      );

      if (decision === 'accept') {
        // Refresh the drivers list since a new driver was accepted and joined the company
        await queryClient.invalidateQueries({ queryKey: ['company-drivers'] });
      }
    } catch (error) {
      console.error('Join request decision failed:', error);
      setRequestsError(error instanceof Error ? error.message : 'Unable to update request status');
    } finally {
      setPendingActionId(null);
    }
  };

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  useEffect(() => {
    if (session?.companyCode) setCompanyCode(session.companyCode);
  }, [session]);

  const assignmentSteps = [
    { title: 'Enter Driver Details', desc: 'Fill in all required information about the driver' },
    { title: 'Assign Vehicle', desc: 'Link the driver to their designated vehicle' },
    { title: 'Start Monitoring', desc: 'Driver is now active in your system' },
  ];

  const importantNotes = [
    'All fields marked with * are required',
    'Drivers will be notified via email after assignment',
    'Each vehicle should have a unique ID',
    'Other status can be changed user from the drivers list',
  ];

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left side - Form */}
      <div className="col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Assign Driver</h1>
          <p className="text-sm text-slate-500 mb-8">Add new drivers to your monitoring system</p>

          {assignSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Driver assigned successfully and saved to drivers data!</span>
            </div>
          )}

          {assignError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
              <span className="text-rose-500 font-bold">⚠️</span>
              <span>{assignError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Driver Information Section */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={assignLoading}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                    disabled={assignLoading}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234-567-8900"
                    disabled={assignLoading}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={assignLoading}
              className="w-full mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {assignLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Assigning Driver...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Assign Driver</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Info panels */}
      <div className="col-span-1 space-y-5">
        {/* Company Code Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
          <p className="text-sm font-medium text-indigo-200 mb-2">Company Code</p>
          <div className="text-4xl font-bold tracking-widest mb-3">{activeCompanyCode ?? 'No code available'}</div>
          <p className="text-sm text-indigo-100 mb-4">
            Share this generated company code with drivers so they can request to join your company.
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Pending Join Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Join Requests</h3>
              <p className="text-sm text-slate-500">Review drivers requesting to join with your company code.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {visibleJoinRequests.length}
            </span>
          </div>

          {loadingRequests ? (
            <p className="text-sm text-slate-500">Loading requests…</p>
          ) : requestsError ? (
            <p className="text-sm text-rose-600">{requestsError}</p>
          ) : visibleJoinRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No driver requests for your company code at the moment.</p>
          ) : (
            <div className="space-y-4">
              {visibleJoinRequests.map(request => (
                <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{request.userName}</p>
                      <p className="text-sm text-slate-500">{request.userEmail}</p>
                      <p className="text-sm text-slate-500 mt-2">{request.userPhoneNumber}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mt-3">Status</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1 ${
                        request.status.toLowerCase() === 'approved' || request.status.toLowerCase() === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : request.status.toLowerCase() === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Requested</p>
                      <p className="text-sm text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingActionId === request.id || request.status.toLowerCase() !== 'pending'}
                      onClick={() => handleDecision(request.id, 'accept')}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {pendingActionId === request.id ? 'Processing…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={pendingActionId === request.id || request.status.toLowerCase() !== 'pending'}
                      onClick={() => handleDecision(request.id, 'reject')}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignment Process */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            Assignment Process
          </h3>
          <div className="space-y-4">
            {assignmentSteps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <MapPin size={16} />
            Important Notes
          </h3>
          <ul className="space-y-2">
            {importantNotes.map((note, idx) => (
              <li key={idx} className="text-xs text-amber-900 flex gap-2">
                <span className="font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
