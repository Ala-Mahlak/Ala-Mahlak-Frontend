import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCompanyDrivers, type CompanyDriver } from '../services/authService';

interface LocationState {
  driver?: CompanyDriver;
}

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [driver, setDriver] = useState<CompanyDriver | null>(state?.driver ?? null);
  const [loading, setLoading] = useState(!driver);
  const [error, setError] = useState<string | null>(null);

  const driverId = useMemo(() => (id ? Number(id) : NaN), [id]);

  useEffect(() => {
    if (driver || Number.isNaN(driverId)) {
      setLoading(false);
      return;
    }

    const loadDriver = async () => {
      setLoading(true);
      setError(null);

      try {
        const drivers = await getCompanyDrivers();
        const found = drivers.find(item => item.id === driverId);
        if (!found) {
          setError('Driver not found.');
          return;
        }
        setDriver(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load driver details');
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [driver, driverId]);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Back to drivers
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {loading ? (
          <div className="text-sm text-slate-500">Loading driver details…</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : driver ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
                  {driver.profilePhoto ? (
                    <img src={driver.profilePhoto} alt={driver.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-600">
                      {driver.name
                        .split(' ')
                        .map(part => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">{driver.name}</h1>
                  <p className="text-sm text-slate-500">{driver.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Company code</div>
                  <div className="mt-2 font-semibold text-slate-900">{driver.compCode}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Status</div>
                  <div className="mt-2 font-semibold text-slate-900">{driver.isActive ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Joined</div>
                  <div className="mt-2 font-semibold text-slate-900">{new Date(driver.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Email</div>
                  <div className="mt-2 font-semibold text-slate-900">{driver.email}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h2>
                <div className="text-sm text-slate-700">Phone</div>
                <div className="text-slate-500">{driver.phoneNumber}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Profile</h2>
                <div className="text-sm text-slate-700">Role</div>
                <div className="text-slate-500">{driver.role}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
