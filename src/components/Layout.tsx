import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Menu, AlertTriangle, UserPlus, Car, Check, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard Overview', subtitle: 'Real-time monitoring of your fleet' },
  '/companies': { title: 'Companies', subtitle: 'Manage admins, logo, and company reports' },
  '/drivers': { title: 'Drivers Management', subtitle: 'Manage and monitor all your drivers' },
  '/alerts': { title: 'Distraction Alerts', subtitle: 'Review and manage safety alerts' },
  '/assign': { title: 'Assign Drivers', subtitle: 'Add new drivers to your fleet' },
  '/support': { title: 'Support Center', subtitle: 'Manage driver communications and tickets' },
  '/profile': { title: 'Profile', subtitle: 'View and update your account information' },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const page = PAGE_TITLES[location.pathname] || PAGE_TITLES['/dashboard'];
  const showPageHeading = location.pathname !== '/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = session?.name || 'Account';
  const displayEmail = session?.email || '';
  const initials = (displayName || 'A')
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
              >
                <Menu size={18} />
              </button>
            </div>
            <div className="min-w-0">
              {showPageHeading && (
                <>
                  <h1 className="truncate text-xl font-semibold text-slate-900">{page.title}</h1>
                  <p className="text-xs text-slate-500">{page.subtitle}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNotificationsOpen(prev => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(n => {
                            const Icon = n.type === 'alert'
                              ? AlertTriangle
                              : n.type === 'assignment'
                              ? UserPlus
                              : Car;

                            const iconColorClass = n.type === 'alert'
                              ? 'bg-rose-50 text-rose-500 border-rose-100'
                              : n.type === 'assignment'
                              ? 'bg-indigo-50 text-indigo-500 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-500 border-emerald-100';

                            return (
                              <div
                                key={n.id}
                                className={`px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50/80 ${
                                  !n.read ? 'bg-blue-50/20' : ''
                                }`}
                              >
                                <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border ${iconColorClass}`}>
                                  <Icon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 leading-normal">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-xs font-semibold text-slate-800 truncate ${!n.read ? 'font-bold' : ''}`}>
                                      {n.title}
                                    </p>
                                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                                      {n.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/20 flex justify-end">
                          <button
                            onClick={clearNotifications}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                          >
                            <Trash2 size={12} />
                            Clear all
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => navigate('/profile')} className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
                  {session?.profilePhoto ? (
                    <img src={session.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-800">{displayName}</div>
                  <div className="text-xs text-slate-500">{displayEmail}</div>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="page-fade-in"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
