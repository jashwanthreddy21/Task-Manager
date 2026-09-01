import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Login() {
  const login = useStore((state) => state.login);
  const authLoading = useStore((state) => state.authLoading);
  
  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      await login(email, password, rememberMe);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900 font-sans">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px] pulse-bg"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pulse-bg"></div>

      {/* Left side: Premium SaaS Illustration Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 z-10 relative text-white border-r border-white/5 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary-500/25">
            S
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            SaaSFlow
          </span>
        </div>

        <div className="space-y-6 max-w-lg my-auto">
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-primary-400 bg-primary-950/40 rounded-full border border-primary-800/30 uppercase">
            Productivity Hub
          </span>
          <h2 className="text-4xl font-extrabold font-sans leading-tight">
            Streamline your project lifecycles instantly.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Collaborate in real-time, view rich metric analytics, and drag-and-drop tasks directly on our premium interactive Kanban workspace.
          </p>
          
          <div className="flex gap-8 pt-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">99.9%</span>
              <span className="text-xs text-slate-400">Uptime Secured</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-indigo-400">10x</span>
              <span className="text-xs text-slate-400">Faster Workflows</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SaaSFlow Corporation. All rights reserved.
        </div>
      </div>

      {/* Right side: Modern Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-indigo-500/10 rounded-bl-full"></div>
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Welcome back</h3>
            <p className="text-slate-400 text-sm">Enter your credentials to access your SaaS portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                />
              </div>
              {errors.email && <span className="text-xs text-rose-500 font-medium pl-1 mt-1">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  className="text-xs text-primary-400 hover:text-primary-300 hover:underline transition-colors"
                  onClick={() => alert("Remembered Password details? Just write password details, database allows easy register/login override.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-11 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-700"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-rose-500 font-medium pl-1 mt-1">{errors.password}</span>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 accent-primary-500 bg-slate-950 border-slate-800 rounded focus:ring-0 focus:ring-offset-0"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-slate-400">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl py-3 font-semibold text-sm shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
            <p className="text-sm text-slate-400">
              New to the platform?{' '}
              <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300 hover:underline transition-colors">
                Create a Free Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
