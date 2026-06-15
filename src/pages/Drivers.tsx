import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus } from 'lucide-react';
import type { CompanyDriver } from '../services/authService';
import { useCompanyDriversQuery } from '../hooks/useAppData';

const statusConfig = {
  active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500 pulse-dot' },
  offline: { label: 'Offline', class: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};


export default function Drivers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'offline'>('all');
  const { data: drivers = [], isLoading: loading, error } = useCompanyDriversQuery();

  const filtered = drivers.filter(d => {
    const matchSearch = [d.name, d.email, d.phoneNumber, d.role, d.compCode]
      .some(value => value.toLowerCase().includes(search.toLowerCase()));
    const status = d.isActive ? 'active' : 'offline';
    const matchFilter = filter === 'all' || status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: drivers.length,
    active: drivers.filter(d => d.isActive).length,
    offline: drivers.filter(d => !d.isActive).length,
  };

  const formatInitials = (driver: CompanyDriver) =>
    driver.name
      .split(' ')
      .map(part => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
          {(['all', 'active', 'offline'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'offline' ? 'Inactive' : 'Active'}
              <span className={`ml-1.5 ${filter === f ? 'text-blue-200' : 'text-slate-400'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={14} />
            <span>Sort</span>
          </button>
          <button
            onClick={() => navigate('/assign')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/25"
          >
            <UserPlus size={15} />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-slate-400">
        {loading ? 'Loading drivers…' : `Showing ${filtered.length} of ${drivers.length} drivers`}
      </div>


      {/* Table list */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-slate-300 text-4xl mb-3">⏳</div>
          <div className="text-slate-500 font-medium">Loading drivers</div>
          <div className="text-slate-400 text-sm mt-1">Please wait while we fetch your company drivers.</div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-rose-100">
          <div className="text-rose-500 text-4xl mb-3">⚠️</div>
          <div className="text-slate-500 font-medium">Unable to load drivers</div>
          <div className="text-slate-400 text-sm mt-1">{error instanceof Error ? error.message : 'Failed to load drivers'}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-slate-300 text-4xl mb-3">👤</div>
          <div className="text-slate-500 font-medium">No drivers found</div>
          <div className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</div>
        </div>
      ) : (
        <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="text-sm text-slate-600 font-semibold">Drivers</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Driver</th>
                <th className="px-6 py-3 text-left">Contact</th>
                <th className="px-6 py-3 text-left">Company Code</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const sc = statusConfig[d.isActive ? 'active' : 'offline'];
                return (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        {d.profilePhoto ? (
                          <img src={d.profilePhoto} alt={d.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                            style={{ background: '#4f7df3' }}
                          >
                            {formatInitials(d)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">{d.name}</div>
                          <div className="text-xs text-slate-400">{d.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-xs text-slate-600">{d.email}</div>
                      <div className="text-xs text-slate-400 mt-1">{d.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">{d.compCode}</td>
                    <td className="px-6 py-4 align-top">
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${sc.class}`}>
                        <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <div className="text-sm font-semibold">{new Date(d.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500 mt-1">Joined</div>
                    </td>
                    <td className="px-6 py-4 align-top text-indigo-600 font-medium">
                      <button
                        onClick={() => navigate(`/drivers/${d.id}`, { state: { driver: d } })}
                        className="text-sm hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          </div>
      )}
    </div>
  );
}
