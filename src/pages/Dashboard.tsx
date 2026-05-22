import { useNavigate } from 'react-router-dom';
import { Activity, Car, Clock3, TriangleAlert, Users, Smartphone, Moon, Eye, Utensils } from 'lucide-react';
import { alerts, drivers } from '../data/mockData';

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'Phone Usage':
      return <Smartphone size={14} className="text-blue-600" />;
    case 'Drowsiness Detected':
      return <Moon size={14} className="text-amber-600" />;
    case 'Looking Away':
      return <Eye size={14} className="text-slate-600" />;
    case 'Eating / Drinking':
      return <Utensils size={14} className="text-orange-600" />;
    default:
      return <TriangleAlert size={14} className="text-slate-400" />;
  }
};

const stats = [
  {
    label: 'Total Drivers',
    value: '4',
    icon: Users,
    light: 'bg-indigo-50',
    text: 'text-indigo-600',
    note: '2 active now',
    noteColor: 'text-emerald-500',
  },
  {
    label: 'Active Trips',
    value: '2',
    icon: Car,
    light: 'bg-blue-50',
    text: 'text-blue-600',
    note: 'In progress',
    noteColor: 'text-slate-500',
  },
  {
    label: 'Unhandled Alerts',
    value: '12',
    icon: TriangleAlert,
    light: 'bg-rose-50',
    text: 'text-rose-500',
    note: 'Requires attention',
    noteColor: 'text-rose-500',
  },
  {
    label: "Today's Alerts",
    value: '10',
    icon: Activity,
    light: 'bg-amber-50',
    text: 'text-amber-600',
    note: 'Last 24 hours',
    noteColor: 'text-slate-500',
  },
];

const severityConfig = {
  high: { iconBg: 'bg-rose-50 text-rose-500', badge: 'bg-rose-100 text-rose-600' },
  medium: { iconBg: 'bg-amber-50 text-amber-500', badge: 'bg-amber-100 text-amber-600' },
  low: { iconBg: 'bg-blue-50 text-blue-500', badge: 'bg-blue-100 text-blue-600' },
};

const activeDrivers = drivers.filter(driver => driver.status === 'active').slice(0, 2);
const alertRows = alerts.slice(0, 5);

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time monitoring of your fleet</p>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div>
                <div className="text-sm text-slate-500">{stat.label}</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</div>
                <div className={`mt-1 text-xs ${stat.noteColor}`}>{stat.note}</div>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.light}`}>
                <Icon size={22} className={stat.text} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
          <button
            onClick={() => navigate('/alerts')}
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {alertRows.map(alert => {
            const sc = severityConfig[alert.severity];

            return (
              <div key={alert.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${sc.iconBg}`}>
                      {getAlertIcon(alert.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{alert.driverName}</div>
                    <div className="text-sm text-slate-500">{alert.type}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={12} />
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.badge}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                    Pending
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Drivers</h2>
          <button
            onClick={() => navigate('/drivers')}
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View All Drivers
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeDrivers.map(driver => (
            <div key={driver.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                  style={{ background: driver.color }}
                >
                  {driver.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{driver.name}</div>
                  <div className="text-xs text-slate-500">Vehicle: {driver.driverId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
                  On Trip
                </div>
                <div className="mt-1 text-xs text-slate-400">{driver.totalTrips} total trips</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
