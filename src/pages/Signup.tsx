import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Car, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  registerCompany,
  registerAdmin,
  isAdminApproved,
  saveSession,
} from '../services/authService';

type SignupMode = 'company' | 'admin';

export default function Signup() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<SignupMode>('company');
  const [approvalNotice, setApprovalNotice] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setApprovalNotice(false);

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'company') {
        const res = await registerCompany({
          name: form.name,
          email: form.email,
          password: form.password,
        });
        saveSession(res, { name: form.name, email: form.email });
        setSuccess(res.message || 'Account created! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const res = await registerAdmin({
          name: form.name,
          email: form.email,
          phoneNumber: '',
          password: form.password,
        });
        
        if (!isAdminApproved(res.token.role)) {
          setApprovalNotice(true);
        } else {
          saveSession(res, { name: form.name, email: form.email });
          setSuccess(res.message || 'Admin account created! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition disabled:opacity-60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Car size={18} className="text-white" />
          </div>
          <span className="text-slate-800 text-xl font-bold">علي مهلك</span>
        </div>

        <div className="mb-8">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('company'); setError(''); setSuccess(''); setApprovalNotice(false); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                mode === 'company'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setError(''); setSuccess(''); setApprovalNotice(false); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                mode === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Admin
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Create {mode} account
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {mode === 'company'
              ? 'Start monitoring your fleet in minutes'
              : 'Register as an admin for your organization'}
          </p>
        </div>

        {approvalNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Your admin account is registered but pending approval. You will be able to log in once a SuperAdmin approves your account.
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"
          >
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {mode === 'company' ? 'Company Name' : 'Full Name'}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder={mode === 'company' ? 'Your Company Ltd.' : 'John Doe'}
                required
                disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={mode === 'company' ? 'company@example.com' : 'admin@example.com'}
                required
                disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  required
                  disabled={loading}
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                mode === 'company' ? 'Create Company Account' : 'Register as Admin'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
