import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  User, 
  Mail, 
  Lock, 
  Trash2, 
  Camera, 
  ShieldAlert,
  Save,
  Key
} from 'lucide-react';

export default function Profile() {
  const { 
    user, 
    updateProfile, 
    uploadAvatar, 
    deleteAccount 
  } = useStore();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const avatarUrl = user?.avatar ? `${API_URL}${user.avatar}` : null;

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loader & Error states
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }
    setError('');
    setUpdating(true);
    
    const payload = { name: name.trim(), email: email.trim() };
    if (password) {
      if (password !== confirmPassword) {
        setError('New passwords do not match.');
        setUpdating(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setUpdating(false);
        return;
      }
      payload.password = password;
    }

    const success = await updateProfile(payload);
    if (success) {
      setPassword('');
      setConfirmPassword('');
    }
    setUpdating(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and WEBP image uploads are allowed.');
      return;
    }

    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const handleDeleteProfile = async () => {
    const warningText = `WARNING: Are you absolutely sure you want to permanently delete your account? \n\nThis will permanently erase all your projects, task metrics, and uploaded files. This action CANNOT be undone.`;
    if (window.confirm(warningText)) {
      const confirmInput = window.prompt("Type 'DELETE' to confirm account erasure:");
      if (confirmInput === 'DELETE') {
        await deleteAccount();
      } else {
        alert('Confirmation string did not match. Deletion cancelled.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header section */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">Account Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Control your user profile metadata, reset password hashes, and load custom avatars.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left avatar card widget */}
        <div className="glass-panel p-6 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-bl-full pointer-events-none"></div>

          {/* Avatar frame */}
          <div className="relative group">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-28 h-28 rounded-full border-2 border-primary-500 object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-3xl border-2 border-primary-300 shadow-md">
                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}

            {/* Hover overlay camera upload */}
            <label className="absolute inset-0 bg-slate-950/50 hover:bg-slate-950/75 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity border-2 border-dashed border-white/50 select-none">
              <Camera size={18} className="mb-1" />
              {uploading ? 'Loading...' : 'Upload Avatar'}
              <input type="file" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>

          <h3 className="font-bold text-slate-800 dark:text-white text-base mt-4">{user?.name}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
          
          <span className="inline-block mt-3 px-3 py-1 rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/10 uppercase tracking-wider select-none">
            Active Developer
          </span>
        </div>

        {/* Right forms panel (2 columns) */}
        <div className="md:col-span-2 space-y-6">
          {/* General and password configurations form */}
          <form onSubmit={handleUpdateProfile} className="glass-panel p-6 space-y-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <User size={16} className="text-primary-500" />
              General Details
            </h3>

            {error && (
              <div className="flex gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-xs font-semibold">
                <ShieldAlert size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Full name..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="Email address..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pt-3 pb-3 flex items-center gap-2">
              <Key size={16} className="text-indigo-500" />
              Update Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-355 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="Min 6 characters..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Confirm New Password input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-355 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="Repeat password..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-primary-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={14} />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Delete Account widget danger zone */}
          <div className="glass-panel p-6 border border-rose-500/15 bg-rose-50/10 dark:bg-rose-950/5 space-y-4">
            <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm border-b border-rose-500/10 pb-3 flex items-center gap-2">
              <ShieldAlert size={16} />
              Danger Zone
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Permanently delete this account, task metadata metrics, comments, attachments and file logs. This operation cannot be rolled back.
            </p>
            <button
              onClick={handleDeleteProfile}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/10 active:scale-[0.98] transition-all"
            >
              <Trash2 size={14} />
              Delete Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
