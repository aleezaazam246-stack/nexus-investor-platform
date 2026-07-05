/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, Key, RefreshCw, ArrowRight } from 'lucide-react';
import { AuthResponse } from '../types';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA state machine
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Double check your password.');
      }

      if (data.require2FA) {
        setRequire2FA(true);
        setTempToken(data.tempToken);
        setDebugOtp(data.debugOtp || '123456');
      } else {
        onLoginSuccess(data.token, data.user);
        redirectUser(data.user.role);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) {
      setError('Verification code cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode, tempToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid 2FA code.');
      }

      onLoginSuccess(data.token, data.user);
      redirectUser(data.user.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: string) => {
    if (role === 'Investor') {
      navigate('/investor-dashboard');
    } else {
      navigate('/entrepreneur-dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto border border-blue-500 shadow-sm">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {require2FA ? 'Two-Factor Authentication' : 'Secure Platform Entry'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            {require2FA
              ? 'Multi-factor verification is enabled on your venture profile.'
              : 'Endorse agreements, schedule pitch boards, and process sandbox investments.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-600 text-xs flex items-start space-x-2 animate-pulse">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phase 1: Password entry */}
        {!require2FA ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Venture Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@nexus.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Enter Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Phase 2: Mock 2FA Code entry */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                6-Digit Security Token Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3.5 h-4 w-4 text-blue-500" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-center text-lg font-mono font-bold tracking-widest text-blue-600 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Sandbox assistance indicator */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-blue-700 text-xs leading-relaxed">
              <span className="font-semibold block uppercase tracking-wider mb-0.5 text-[10px]">Sandbox Passkey Helper:</span>
              Your mock authentication generator has configured OTP: <strong className="font-mono text-emerald-600 font-bold">{debugOtp}</strong> to bypass 2FA safely.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Verify Token Code</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequire2FA(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Back to credentials login
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-5 text-center">
          <p className="text-slate-500 text-xs">
            New entrepreneur or capital group?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              Create Nexus ID
            </Link>
          </p>
          <div className="mt-4 flex justify-center space-x-2 text-[10px] text-slate-400 font-mono">
            <span>Demo: alice@nexus.io</span>
            <span>/</span>
            <span>password123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
