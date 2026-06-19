import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Bell, ImagePlus, Loader2, Mail, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateCompanyLogo, updateCompanyProfile, updateAdminProfile } from '../services/authService';

export default function Profile() {
  const { session, userType, updateSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(session?.profilePhoto ?? '');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
  });

  const isCompany = userType === 'company';
  const nameLabel = isCompany ? 'Company Name' : 'Full Name';

  useEffect(() => {
    setForm({
      name: session?.name ?? '',
      email: session?.email ?? '',
      phoneNumber: session?.phoneNumber ?? '',
      role: session?.role ?? '',
    });
    setPhotoPreview(session?.profilePhoto ?? '');
  }, [session]);

  const initials = useMemo(() => (form.name || form.email || 'U')
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase(), [form.email, form.name]);

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read selected image'));
    reader.readAsDataURL(file);
  });

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError('');
    setSavingLogo(true);

    try {
      const preview = await readFileAsDataUrl(file);

      if (isCompany) {
        await updateCompanyLogo({ logoFile: file, removeLogo: false });
      } else {
        await updateAdminProfile({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          profilePhoto: file,
        });
      }

      setPhotoPreview(preview);
      updateSession({ profilePhoto: preview });
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : 'Failed to update profile photo');
    } finally {
      setSavingLogo(false);
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setLogoError('');
    setSavingLogo(true);

    try {
      if (isCompany) {
        await updateCompanyLogo({ removeLogo: true });
      } else {
        await updateAdminProfile({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          removePhoto: true,
        });
      }

      setPhotoPreview('');
      updateSession({ profilePhoto: undefined });
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : 'Failed to remove profile photo');
    } finally {
      setSavingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const name = form.name.trim();
      const email = form.email.trim();
      const phoneNumber = form.phoneNumber.trim() || undefined;

      if (isCompany) {
        await updateCompanyProfile({ name, email, phoneNumber });
      } else {
        await updateAdminProfile({ name, email, phoneNumber });
      }

      updateSession({ name, email, phoneNumber, profilePhoto: photoPreview || undefined });
      setProfileMessage('Profile saved successfully.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-xl font-bold text-white"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/35">
              <ImagePlus size={18} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="text-sm text-slate-500">Manage your account details{session?.companyCode ? ` · ${session.companyCode}` : ''}</p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

        {logoError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {logoError}
          </div>
        )}

        {profileError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {profileError}
          </div>
        )}

        {profileMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {profileMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{nameLabel}</span>
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
            <span className="text-sm font-medium text-slate-700">Phone Number</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <Phone size={16} className="text-slate-400" />
              <input
                value={form.phoneNumber}
                onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3">
              <ShieldCheck size={16} className="text-slate-400" />
              <input
                value={form.role}
                readOnly
                className="w-full bg-transparent text-sm text-slate-500 outline-none"
              />
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={savingLogo}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingLogo ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            Remove Photo
          </button>
        </div>
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