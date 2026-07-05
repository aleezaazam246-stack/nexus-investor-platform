/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, UserPlus, Key, RefreshCw, Briefcase, TrendingUp, HelpCircle } from 'lucide-react';

interface SignupViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function SignupView({ onLoginSuccess }: SignupViewProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<'Entrepreneur' | 'Investor'>('Entrepreneur');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile fields
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [sector, setSector] = useState('Energy & Greentech');
  const [stage, setStage] = useState('Seed');
  const [fundingTarget, setFundingTarget] = useState('500000');
  const [investmentThesis, setInvestmentThesis] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA Verification steps
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare role profile payload
    const profile: any = {};
    if (role === 'Entrepreneur') {
      profile.companyName = companyName || 'My Startup Project';
      profile.bio = bio || 'Building the future of technology';
      profile.website = website || 'https://mystartup.io';
      profile.sector = sector;
      profile.stage = stage;
      profile.fundingTarget = Number(fundingTarget) || 500000;
    } else {
      profile.companyName = companyName || 'Angel Syndicate';
      profile.bio = bio || 'Syndicate backer';
      profile.website = website || 'https://myportfolio.io';
      profile.investmentThesis = investmentThesis || 'Backing hyper-growth deeptech startups';
      profile.preferredStages = ['Pre-seed', 'Seed'];
      profile.preferredSectors = ['Energy & Greentech', 'Medtech & AI'];
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, profile })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setRequire2FA(true);
      setTempToken(data.tempToken);
      setDebugOtp(data.debugOtp || '123456');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) {
      setError('Verification code is required.');
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
        throw new Error(data.error || '2FA verification code rejected.');
      }

      onLoginSuccess(data.token, data.user);
      
      if (data.user.role === 'Investor') {
        navigate('/investor-dashboard');
      } else {
        navigate('/entrepreneur-dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto border border-blue-500 shadow-sm">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {require2FA ? 'Confirm Identity 2FA' : 'Establish Nexus Partnership ID'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            {require2FA
              ? 'Complete onboarding security setup to activate your dashboard.'
              : 'Join as a deeptech entrepreneur raising funding, or an investor allocating ledger assets.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-600 text-xs flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phase 1: Onboarding forms */}
        {!require2FA ? (
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            
            {/* Role switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Choose Collaboration Persona Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('Entrepreneur')}
                  className={`py-3 px-4 rounded-xl border font-sans font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    role === 'Entrepreneur'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Entrepreneur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Investor')}
                  className={`py-3 px-4 rounded-xl border font-sans font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    role === 'Investor'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Investor</span>
                </button>
              </div>
            </div>

            {/* Core credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Venture Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="email@nexus.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Key Password
                </label>
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
            </div>

            <hr className="border-slate-100" />

            {/* Role specific forms */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                {role} Profile Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {role === 'Entrepreneur' ? 'Startup / Company Name' : 'Venture Capital Firm / Syndicate'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aether Renewable Fusion"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://aetherfusion.io"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {role === 'Entrepreneur' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Market Sector
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      >
                        <option>Energy & Greentech</option>
                        <option>Medtech & AI</option>
                        <option>Deeptech & Robotics</option>
                        <option>Aerospace</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Growth Stage
                      </label>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      >
                        <option>Pre-seed</option>
                        <option>Seed</option>
                        <option>Series A</option>
                        <option>Series B</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Funding Target ($)
                      </label>
                      <input
                        type="number"
                        placeholder="1500000"
                        value={fundingTarget}
                        onChange={(e) => setFundingTarget(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Elevator Pitch / Bio Overview
                    </label>
                    <textarea
                      placeholder="Explain your technology, patents, and product roadmap in 2 sentences."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Investment Thesis / Mandate
                  </label>
                  <textarea
                    placeholder="Describe your syndicate values, asset sizes, and average ticket sizes."
                    value={investmentThesis}
                    onChange={(e) => setInvestmentThesis(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Register & Setup On-Demand 2FA</span>
              )}
            </button>
          </form>
        ) : (
          /* Phase 2: 2FA Setup verification code input */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirm OTP Security Key
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
              <span className="font-semibold block uppercase tracking-wider mb-0.5 text-[10px]">Onboarding Auth Token:</span>
              Your security protocol initialized key: <strong className="font-mono text-emerald-600 font-bold">{debugOtp}</strong> to verify this connection.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Verify Token & Activate Account</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequire2FA(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Modify profile details
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-5 text-center">
          <p className="text-slate-500 text-xs">
            Already registered on Nexus?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
