import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Eye, EyeOff, User, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Register() {
  const registerAction = useStore((state) => state.register);
  const authLoading = useStore((state) => state.authLoading);
  const addNotification = useStore((state) => state.addNotification);
  const navigate = useNavigate();

  // Field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Strength states
  const [errors, setErrors] = useState({});
  
  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'No password', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { score: 20, text: 'Weak', color: 'bg-rose-500' };
      case 2:
      case 3:
        return { score: 50, text: 'Fair', color: 'bg-amber-500' };
      case 4:
        return { score: 80, text: 'Good', color: 'bg-indigo-500' };
      case 5:
      default:
        return { score: 100, text: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const validate = () => {
    const tempErrors = {};
    if (!name) tempErrors.name = 'Full name is required';
    
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email address is invalid';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      tempErrors.agreeTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const success = await registerAction(name, email, password);
      if (success) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900 font-sans">
      {/* Background radial blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] pulse-bg"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pulse-bg"></div>

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
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-950/40 rounded-full border border-emerald-800/30 uppercase">
            Start Instantly
          </span>
          <h2 className="text-4xl font-extrabold leading-tight">
            Empower your development workflows.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Create an account in less than a minute. Gain full workspace access to Kanban boards, charts, tags, task logging, and secure uploads.
          </p>

          <div className="flex gap-6 items-center text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-emerald-400" />
              100% Secure Hashing
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            <div>No Credit Card Required</div>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SaaSFlow Corporation. All rights reserved.
        </div>
      </div>

      {/* Right side: Register Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl relative">
          
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-1">Create your account</h3>
            <p className="text-slate-400 text-sm">Join thousands of teams shipping faster.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                />
              </div>
              {errors.name && <span className="text-xs text-rose-500 font-medium pl-1">{errors.name}</span>}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="john@company.com"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                />
              </div>
              {errors.email && <span className="text-xs text-rose-500 font-medium pl-1">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-11 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-700"
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
              {errors.password && <span className="text-xs text-rose-500 font-medium pl-1">{errors.password}</span>}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 pl-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Password Strength</span>
                    <span className="font-bold">{strength.text}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-700"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                />
              </div>
              {errors.confirmPassword && <span className="text-xs text-rose-500 font-medium pl-1">{errors.confirmPassword}</span>}
            </div>

            {/* T&C Checked */}
            <div className="flex flex-col gap-1 py-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 accent-primary-500 bg-slate-950 border-slate-800 rounded mt-0.5"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: null }));
                  }}
                />
                <span className="text-xs text-slate-400 leading-normal">
                  I agree to the{' '}
                  <span className="text-primary-400 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-primary-400 hover:underline">Privacy Policy</span>.
                </span>
              </label>
              {errors.agreeTerms && <span className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.agreeTerms}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl py-2.5 font-semibold text-sm shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300 hover:underline transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
