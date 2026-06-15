import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, UserPlus, MessageCircle, LogOut, X, UserCircle2, Loader2, Building2
} from 'lucide-react';
import type { MouseEventHandler } from 'react';
import { useState } from 'react';
import logoAnimation from '../assets/Ala Mahla 1st Logo Animation.gif';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';


const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/drivers', icon: Users, label: 'Drivers' },
  { path: '/assign', icon: UserPlus, label: 'Assign Drivers' },
  { path: '/support', icon: MessageCircle, label: 'Support', badge: 3 },
];

type Props = {
  isOpen?: boolean;
  onClose?: MouseEventHandler;
};

export default function Sidebar({ isOpen = false, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const { session, logout } = useAuth();

  const displayName = session?.name || session?.email || 'Account';
  const displayRole = session?.role || 'Administrator';
  const initials = (displayName || 'A')
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
    setLoggingOut(false);
  };

  const inner = (
    <>
      <div className="border-b border-slate-200 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center">
            <img src={logoAnimation} alt="Logo" />
          </div>
          <div>
            <div className="text-lg font-bold text-indigo-600">AlaMahlak</div>
            <div className="text-[11px] text-slate-500">Driver Monitoring</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 px-4 py-4">
        <button onClick={() => navigate('/profile')} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {session?.profilePhoto ? (
              <img src={session.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{displayName}</div>
            <div className="text-xs text-slate-500">{displayRole}</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-500 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <button
          onClick={() => navigate('/profile')}
          className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-800"
        >
          <UserCircle2 size={15} />
          <span>Profile</span>
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
        {inner}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative w-64 bg-white border-r border-slate-200 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold text-indigo-600">FleetWatch</div>
                <button onClick={onClose} className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
                  <X />
                </button>
              </div>
              {inner}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
