import { useState, useMemo, useEffect, useCallback } from 'react';
import { Smartphone, Eye, Moon, Utensils, CheckCircle, MapPin, Clock, Search } from 'lucide-react';
import { trips as mockTrips, alerts } from '../data/mockData';
import { getCompanyTrips, type CompanyTrip } from '../services/authService';

const getAlertIcon = (type: string) => {
  const iconProps = { size: 20 };
  switch (type) {
    case 'Phone Usage':
      return <Smartphone {...iconProps} className="text-blue-600" />;
    case 'Drowsiness Detected':
      return <Moon {...iconProps} className="text-amber-600" />;
    case 'Looking Away':
      return <Eye {...iconProps} className="text-slate-600" />;
    case 'Eating / Drinking':
      return <Utensils {...iconProps} className="text-orange-600" />;
    default:
      return <Eye {...iconProps} className="text-slate-400" />;
  }
};

const severityStyles = {
  high: { badge: 'bg-red-100 text-red-600' },
  medium: { badge: 'bg-amber-100 text-amber-700' },
  low: { badge: 'bg-blue-100 text-blue-600' },
};

const statusConfig = {
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', class: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

export default function TripMonitoring() {
  const [alertSeverity, setAlertSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [alertStatus, setAlertStatus] = useState('all');
  const [companyTrips, setCompanyTrips] = useState<CompanyTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [tripFilter, setTripFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [tripSearch, setTripSearch] = useState('');

  const loadCompanyTrips = useCallback(async () => {
    setTripsLoading(true);
    setTripsError(null);
    try {
      const response = await getCompanyTrips();
      setCompanyTrips(response);
    } catch (err) {
      setTripsError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanyTrips();
  }, [loadCompanyTrips]);

  const filteredCompanyTrips = useMemo(() => {
    return companyTrips.filter(t => {
      const matchSearch = tripSearch === '' || 
        t.driverName?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.startLocation?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.endLocation?.toLowerCase().includes(tripSearch.toLowerCase());
      const matchFilter = tripFilter === 'all' || t.status === tripFilter;
      return matchSearch && matchFilter;
    });
  }, [companyTrips, tripFilter, tripSearch]);

  const activeTrips = mockTrips.filter(t => t.status === 'active');

  const filteredAlerts = useMemo(() => 
    alerts.filter(a => {
      const matchSeverity = alertSeverity === 'all' || a.severity === alertSeverity;
      return matchSeverity;
    }), 
    [alertSeverity]
  );

  const alertStats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    unhandled: alerts.length,
  };

  const tripCounts = {
    all: companyTrips.length,
    active: companyTrips.filter(t => t.status === 'active').length,
    completed: companyTrips.filter(t => t.status === 'completed').length,
    cancelled: companyTrips.filter(t => t.status === 'cancelled').length,
  };

  const formatInitials = (name: string) =>
    name?.split(' ').map(part => part[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-5">

      {/* Company Trips from API */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Company Trips</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={tripSearch}
                onChange={e => setTripSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none w-40"
              />
            </div>
            <select
              value={tripFilter}
              onChange={e => setTripFilter(e.target.value as typeof tripFilter)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none"
            >
              <option value="all">All ({tripCounts.all})</option>
              <option value="active">Active ({tripCounts.active})</option>
              <option value="completed">Completed ({tripCounts.completed})</option>
              <option value="cancelled">Cancelled ({tripCounts.cancelled})</option>
            </select>
          </div>
        </div>

        {tripsLoading ? (
          <div className="p-8 text-center">
            <div className="text-slate-400">Loading trips...</div>
          </div>
        ) : tripsError ? (
          <div className="p-8 text-center">
            <div className="text-red-500 text-sm">{tripsError}</div>
          </div>
        ) : filteredCompanyTrips.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-400 text-sm">No trips found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Driver</th>
                  <th className="px-5 py-3 text-left">Route</th>
                  <th className="px-5 py-3 text-left">Start Time</th>
                  <th className="px-5 py-3 text-left">Duration</th>
                  <th className="px-5 py-3 text-left">Distance</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanyTrips.map(t => {
                  const sc = statusConfig[t.status] || statusConfig.cancelled;
                  return (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {t.driverProfilePhoto ? (
                            <img src={t.driverProfilePhoto} alt={t.driverName} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {formatInitials(t.driverName)}
                            </div>
                          )}
                          <span className="font-medium text-slate-700">{t.driverName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs text-slate-600">{t.startLocation}</div>
                            <div className="text-xs text-slate-400">to {t.endLocation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          <div className="text-xs">
                            <div>{new Date(t.startTime).toLocaleDateString()}</div>
                            <div className="text-slate-400">{new Date(t.startTime).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {t.endTime ? formatDuration(t.duration) : '-'}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {t.distance ? `${t.distance} km` : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${sc.class}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Trips (Mock Data) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Active Trips</h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle size={14} />
            <span>{activeTrips.length} in progress</span>
          </div>
        </div>
        <div className="space-y-3">
          {activeTrips.map(tr => (
            <div key={tr.id} className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: tr.driverColor }}>{tr.driverInitials}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{tr.driverName}</div>
                  <div className="text-xs text-slate-400">Started: {tr.startTime} · Distance: {tr.duration}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">Alerts: <span className="font-semibold text-slate-800">{tr.alerts}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Distraction Alerts section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Distraction Alerts</h3>
          <div className="flex items-center gap-3">
            <select
              value={alertStatus}
              onChange={e => setAlertStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none"
            >
              <option value="all">All Alerts</option>
              <option value="unhandled">Unhandled</option>
              <option value="handled">Handled</option>
            </select>
            <select
              value={alertSeverity}
                onChange={e => setAlertSeverity(e.target.value as 'all' | 'high' | 'medium' | 'low')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredAlerts.map(a => (
            <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 flex items-center justify-center">{getAlertIcon(a.type)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-800">{a.driverName}</div>
                    <div className="text-xs text-slate-500 font-medium">{a.type}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{a.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityStyles[a.severity].badge}`}>{a.severity.toUpperCase()}</div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Mark as Handled</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats at bottom */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 text-center">
          <div className="text-3xl font-bold text-slate-800">{alertStats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Total Alerts</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="text-3xl font-bold text-red-600">{alertStats.high}</div>
          </div>
          <div className="text-xs text-slate-500">High Severity</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="text-3xl font-bold text-amber-600">{alertStats.medium}</div>
          </div>
          <div className="text-xs text-slate-500">Medium Severity</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="text-3xl font-bold text-slate-800">{alertStats.unhandled}</div>
          </div>
          <div className="text-xs text-slate-500">Unhandled</div>
        </div>
      </div>
    </div>
  );
}