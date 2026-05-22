import { useState } from 'react';
import { Bell, Mail, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-react';

export default function Profile() {
  const [form, setForm] = useState({
    name: 'Admin User',
    email: 'staff@qa.com',
    phone: '+1 (555) 000-0000',
    role: 'Administrator',
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            AU
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="text-sm text-slate-500">Manage your account details</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <UserCircle2 size={16} className="text-slate-400" />
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <Mail size={16} className="text-slate-400" />
              <input
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <Phone size={16} className="text-slate-400" />
              <input
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <ShieldCheck size={16} className="text-slate-400" />
              <input
                value={form.role}
                onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </label>
        </div>

        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
          <Save size={16} />
          Save Profile
        </button>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Bell size={16} className="text-indigo-600" />
            Notifications
          </div>
          <p className="text-sm text-slate-500">Get notified about urgent fleet alerts and support updates.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <UserCircle2 size={16} className="text-indigo-600" />
            Preferences
          </div>
          <p className="text-sm text-slate-500">This profile page can later be connected to real account settings.</p>
        </div>
      </aside>
    </div>
  );
}