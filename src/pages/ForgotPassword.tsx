import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { forgotPassword } from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Car size={18} className="text-white" />
          </div>
          <span className="text-slate-800 text-xl font-bold">علي مهلك</span>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                  <Mail size={26} className="text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Forgot your password?</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Enter your company email and we'll send you a reset code.
                </p>
              </div>

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

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="company@example.com"
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending code…
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={30} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Check your inbox</h2>
                <p className="text-slate-500 text-sm mb-6">
                  We sent a password reset code to <span className="font-semibold text-slate-700">{email}</span>.
                  Enter it on the next page.
                </p>
                <button
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  Enter Reset Code →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
