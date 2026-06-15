import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Clock, MapPin, Zap, Smartphone, Moon, Eye, Utensils } from 'lucide-react';
import type { AlertSeverity } from '../data/mockData';
import { useAlertsData } from '../hooks/useAppData';

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'Phone Usage':
      return <Smartphone size={24} className="text-blue-600" />;
    case 'Drowsiness Detected':
      return <Moon size={24} className="text-amber-600" />;
    case 'Looking Away':
      return <Eye size={24} className="text-slate-600" />;
    case 'Eating / Drinking':
      return <Utensils size={24} className="text-orange-600" />;
    default:
      return <AlertTriangle size={24} className="text-slate-400" />;
  }
};

const severityConfig: Record<AlertSeverity, {
  border: string; bg: string; badge: string; label: string; dot: string;
}> = {
  high: { border: 'border-l-red-500', bg: 'bg-red-50/50', badge: 'bg-red-100 text-red-700', label: 'High Priority', dot: 'bg-red-500' },
  medium: { border: 'border-l-amber-500', bg: 'bg-amber-50/50', badge: 'bg-amber-100 text-amber-700', label: 'Medium', dot: 'bg-amber-500' },
  low: { border: 'border-l-blue-400', bg: 'bg-blue-50/30', badge: 'bg-blue-100 text-blue-700', label: 'Low', dot: 'bg-blue-500' },
};

const typeOptions = ['All Types', 'Phone Usage', 'Drowsiness', 'Looking Away', 'Eating / Drinking'];
const timeOptions = ['Today', 'This Week', 'This Month'];
const severityOptions: ['all', ...AlertSeverity[]] = ['all', 'high', 'medium', 'low'];

export default function Alerts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [severity, setSeverity] = useState<'all' | AlertSeverity>('all');
  const { data: alerts = [] } = useAlertsData();

  const filtered = alerts.filter(a => {
    const matchSearch =
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.driverName.toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All Types' || a.type === type;
    const matchSeverity = severity === 'all' || a.severity === severity;
    return matchSearch && matchType && matchSeverity;
  });

  const counts = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: counts.total, color: 'text-slate-800', bg: 'bg-white border border-slate-100' },
          { label: 'High Priority', value: counts.high, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Medium Priority', value: counts.medium, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Low Priority', value: counts.low, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 shadow-sm`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        {/* Severity filter */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
          {severityOptions.map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                severity === s ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          {typeOptions.map(t => <option key={t}>{t}</option>)}
        </select>

        <select className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
          {timeOptions.map(t => <option key={t}>{t}</option>)}
        </select>

        <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 ml-auto">
          <Filter size={14} />
          Export
        </button>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <AlertTriangle size={32} className="text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 font-medium">No alerts found</div>
            <div className="text-slate-400 text-sm mt-1">Adjust your filters to see more results</div>
          </div>
        ) : (
          filtered.map(alert => {
            const sc = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${sc.border} overflow-hidden hover:shadow-md transition-shadow`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{alert.type}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{alert.driverName}</span>
                          <span className="text-slate-300">·</span>
                          <span>{alert.driverId}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-blue-500">{alert.tripId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                        <Clock size={11} />
                        {alert.time}
                      </div>
                      <div className="mt-2">
                        <button onClick={() => navigate('/dashboard')} className="text-xs text-blue-500 hover:text-blue-600 font-semibold">
                          View Trip →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Location</div>
                        <div className="text-xs text-slate-700 mt-0.5 font-medium">{alert.location}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Duration</div>
                        <div className="text-xs text-slate-700 mt-0.5 font-medium">{alert.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Action Taken</div>
                        <div className="text-xs text-slate-700 mt-0.5 font-medium">{alert.action}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
