import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  Car,
  ChevronRight,
  Clock,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanyTripsQuery } from '../hooks/useAppData';

/* ------------------------------------------------------------------ */
/*  Stat Card – compact, no side-stripe, subtle depth                 */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'indigo' | 'emerald' | 'sky' | 'rose' | 'violet' | 'teal' | 'amber';
  delay?: number;
}) {
  const toneMap: Record<string, { iconBg: string; iconFg: string; text: string }> = {
    indigo: { iconBg: 'bg-indigo-50', iconFg: 'text-indigo-600', text: 'text-indigo-600' },
    emerald: { iconBg: 'bg-emerald-50', iconFg: 'text-emerald-600', text: 'text-emerald-600' },
    sky: { iconBg: 'bg-sky-50', iconFg: 'text-sky-600', text: 'text-sky-600' },
    rose: { iconBg: 'bg-rose-50', iconFg: 'text-rose-600', text: 'text-rose-600' },
    violet: { iconBg: 'bg-violet-50', iconFg: 'text-violet-600', text: 'text-violet-600' },
    teal: { iconBg: 'bg-teal-50', iconFg: 'text-teal-600', text: 'text-teal-600' },
    amber: { iconBg: 'bg-amber-50', iconFg: 'text-amber-600', text: 'text-amber-600' },
  };
  const style = toneMap[tone] ?? toneMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-shadow duration-300"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconFg}`}>
          <Icon size={18} className="shrink-0" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`mt-0.5 truncate text-xl font-bold tracking-tight ${style.text}`}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function Dashboard() {
  /* ── state ──────────────────────────────────────────────────────── */
  const [tripSearch, setTripSearch] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const {
    data: companyTrips = [],
    isLoading: tripsLoading,
    error: tripsError,
  } = useCompanyTripsQuery();

  /* ── derived stats ──────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalTrips = companyTrips.length;
    const activeTrips = companyTrips.filter((t) => !t.endTime).length;
    const completedTrips = companyTrips.filter((t) => t.endTime).length;
    const totalDistance = companyTrips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0);
    const totalAlerts = companyTrips.reduce((sum, t) => sum + (t.totalAlerts ?? 0), 0);
    const avgSpeed =
      companyTrips.length > 0
        ? companyTrips.reduce((sum, t) => sum + (t.highestSpeedKmH ?? 0), 0) / companyTrips.length
        : 0;
    const uniqueDrivers = new Set(companyTrips.map((t) => t.driverId)).size;

    return {
      totalTrips,
      activeTrips,
      completedTrips,
      totalDistance: totalDistance.toFixed(1),
      totalAlerts,
      avgSpeed: avgSpeed.toFixed(0),
      uniqueDrivers,
    };
  }, [companyTrips]);

  /* ── filtered trips ────────────────────────────────────────────── */
  const filteredCompanyTrips = useMemo(() => {
    if (!tripSearch) return companyTrips;
    const q = tripSearch.toLowerCase();
    return companyTrips.filter(
      (t) =>
        t.driverName?.toLowerCase().includes(q) ||
        t.origin?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.driverEmail?.toLowerCase().includes(q)
    );
  }, [companyTrips, tripSearch]);

  const selectedTrip = useMemo(
    () => companyTrips.find((t) => t.id === selectedTripId) ?? null,
    [companyTrips, selectedTripId]
  );

  /* ── helpers ───────────────────────────────────────────────────── */
  const formatInitials = (name: string) =>
    name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In Progress';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return '-';
    const s = Math.floor(diff / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const getTripStatus = (end?: string) =>
    end
      ? {
          label: 'Completed',
          cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10',
          dot: 'bg-blue-500',
        }
      : {
          label: 'Active',
          cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
          dot: 'bg-emerald-500',
        };

  const formatDateTime = (str: string) => {
    const d = new Date(str);
    return {
      date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
      />
    ));

  return (
    <div className="space-y-6">
      {/* ── Stats Summary ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Trips" value={stats.totalTrips} icon={Car} tone="indigo" delay={0} />
        <StatCard label="Active" value={stats.activeTrips} icon={Activity} tone="emerald" delay={0.03} />
        <StatCard label="Distance" value={`${stats.totalDistance} km`} icon={Route} tone="sky" delay={0.06} />
        <StatCard label="Alerts" value={stats.totalAlerts} icon={AlertTriangle} tone="rose" delay={0.09} />
        <StatCard label="Drivers" value={stats.uniqueDrivers} icon={Users} tone="violet" delay={0.12} />
        <StatCard label="Completed" value={stats.completedTrips} icon={ShieldCheck} tone="teal" delay={0.18} />
      </section>

      {/* ── Company Trips ──────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Company Trips</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {stats.activeTrips} active, {stats.completedTrips} completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
              {companyTrips.length} trip{companyTrips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        {tripsLoading ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            <p className="text-sm text-slate-400">Loading trips…</p>
          </div>
        ) : tripsError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-rose-500">{(tripsError as Error).message || 'Failed to load trips'}</p>
          </div>
        ) : filteredCompanyTrips.length === 0 ? (
          <div className="p-10 text-center">
            <Car size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">No trips found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Driver</th>
                  <th className="px-5 py-3 text-left font-medium">Route</th>
                  <th className="px-5 py-3 text-left font-medium">Start Time</th>
                  <th className="px-5 py-3 text-left font-medium">Duration</th>
                  <th className="px-5 py-3 text-left font-medium">Distance</th>
                  <th className="px-5 py-3 text-left font-medium">Alerts</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredCompanyTrips.map((t) => {
                  const sc = getTripStatus(t.endTime);
                  return (
                    <tr
                      key={t.id}
                      className={`cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70 ${
                        selectedTripId === t.id ? 'bg-indigo-50/60' : ''
                      }`}
                      onClick={() => setSelectedTripId(t.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                            {formatInitials(t.driverName)}
                          </div>
                          <span className="font-medium text-slate-700">{t.driverName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex max-w-[200px] items-start gap-2">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                          <div className="min-w-0">
                            <div className="truncate text-xs text-slate-600">{t.origin}</div>
                            <div className="truncate text-xs text-slate-400">to {t.destination}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          <div className="text-xs">
                            <div>{formatDateTime(t.startTime).date}</div>
                            <div className="text-slate-400">{formatDateTime(t.startTime).time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {formatDuration(t.startTime, t.endTime)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {t.distanceKm != null ? `${t.distanceKm.toFixed(2)} km` : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            t.totalAlerts > 0
                              ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-600/10'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10'
                          }`}
                        >
                          <AlertTriangle size={12} />
                          {t.totalAlerts}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${sc.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight size={16} className="text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Trip Detail Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTrip && (
          <motion.section
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                  {formatInitials(selectedTrip.driverName)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Trip #{selectedTrip.id}</h3>
                  <div className="text-xs text-slate-500">Driver: {selectedTrip.driverName}</div>
                </div>
              </div>
              <button onClick={() => setSelectedTripId(null)} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5">
              {/* Top row */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {/* Driver Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Driver Information</h4>
                  <div className="space-y-3 rounded-xl bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2.5">
                      <Mail size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Email</div>
                        <div className="text-sm text-slate-700">{selectedTrip.driverEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Phone</div>
                        <div className="text-sm text-slate-700">{selectedTrip.driverPhoneNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Building2 size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Company Code</div>
                        <div className="text-sm font-mono text-slate-700">{selectedTrip.compCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Route Details</h4>
                  <div className="space-y-3 rounded-xl bg-slate-50/80 p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1 shrink-0">
                        <div className="h-3 w-3 rounded-full border-2 border-emerald-200 bg-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Origin</div>
                        <div className="text-sm leading-snug text-slate-700">{selectedTrip.origin}</div>
                      </div>
                    </div>
                    <div className="ml-1.5 h-4 border-l-2 border-dashed border-slate-200" />
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1 shrink-0">
                        <div className="h-3 w-3 rounded-full border-2 border-rose-200 bg-rose-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Destination</div>
                        <div className="text-sm leading-snug text-slate-700">{selectedTrip.destination}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Stats */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trip Statistics</h4>
                  <div className="space-y-3 rounded-xl bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2.5">
                      <Clock size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Duration</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {formatDuration(selectedTrip.startTime, selectedTrip.endTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Route size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Distance</div>
                        <div className="text-sm font-semibold text-slate-700">{selectedTrip.distanceKm?.toFixed(2)} km</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Gauge size={14} className="shrink-0 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Highest Speed</div>
                        <div className="text-sm font-semibold text-slate-700">{selectedTrip.highestSpeedKmH} km/h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Time */}
                <div className="rounded-xl bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-slate-400">Start</div>
                      <div className="text-sm text-slate-700">{formatDateTime(selectedTrip.startTime).date} · {formatDateTime(selectedTrip.startTime).time}</div>
                    </div>
                    {selectedTrip.endTime && (
                      <div>
                        <div className="text-xs text-slate-400">End</div>
                        <div className="text-sm text-slate-700">{formatDateTime(selectedTrip.endTime).date} · {formatDateTime(selectedTrip.endTime).time}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="rounded-xl bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Star size={14} className="text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">{renderStars(selectedTrip.rating)}</div>
                    <span className="text-sm font-semibold text-slate-600">{selectedTrip.rating > 0 ? `${selectedTrip.rating}/5` : 'Not rated'}</span>
                  </div>
                </div>

                {/* Alerts */}
                <div className="rounded-xl bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${selectedTrip.totalAlerts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{selectedTrip.totalAlerts}</span>
                    <span className="text-sm text-slate-500">
                      {selectedTrip.totalAlerts === 0 ? 'No alerts' : selectedTrip.totalAlerts === 1 ? 'alert recorded' : 'alerts recorded'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
