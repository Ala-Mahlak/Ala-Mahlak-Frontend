import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard Overview', subtitle: 'Real-time monitoring of your fleet' },
  '/companies': { title: 'Companies', subtitle: 'Manage admins, logo, and company reports' },
  '/drivers': { title: 'Drivers Management', subtitle: 'Manage and monitor all your drivers' },
  '/trips': { title: 'Trip Monitoring', subtitle: 'Track active and completed trips' },
  '/alerts': { title: 'Distraction Alerts', subtitle: 'Review and manage safety alerts' },
  '/assign': { title: 'Assign Drivers', subtitle: 'Add new drivers to your fleet' },
  '/support': { title: 'Support Center', subtitle: 'Manage driver communications and tickets' },
  '/profile': { title: 'Profile', subtitle: 'View and update your account information' },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = PAGE_TITLES[location.pathname] || PAGE_TITLES['/dashboard'];
  const showPageHeading = location.pathname !== '/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <button onClick={() => navigate('/support')} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50">
                <Bell size={16} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <button onClick={() => navigate('/profile')} className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
                  AU
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-800">Admin User</div>
                  <div className="text-xs text-slate-500">staff@qa.com</div>
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
