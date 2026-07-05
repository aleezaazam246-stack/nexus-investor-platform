/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import EntrepreneurDashboard from './views/EntrepreneurDashboard';
import InvestorDashboard from './views/InvestorDashboard';
import { Shield, Sparkles, TrendingUp, Users, ArrowRight, CheckCircle, Briefcase } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session cache upon component mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('nexus_user');
    const cachedToken = localStorage.getItem('nexus_token');
    
    if (cachedUser && cachedToken) {
      try {
        setUser(JSON.parse(cachedUser));
        setToken(cachedToken);
      } catch (e) {
        console.error('Session cache corruption. Discarding cache.', e);
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('nexus_token');
      }
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nexus_token', newToken);
    localStorage.setItem('nexus_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  };

  // Sync user balance inside sub-dashboards on transactions
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-500 text-sm font-mono">Synchronizing Secure Sandbox Handshake...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
        
        {/* Navigation Head */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Content Body */}
        <main className="flex-1">
          <Routes>
            {/* Landing screen */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to={user.role === 'Investor' ? '/investor-dashboard' : '/entrepreneur-dashboard'} replace />
                ) : (
                  <LandingHero />
                )
              } 
            />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to={user.role === 'Investor' ? '/investor-dashboard' : '/entrepreneur-dashboard'} replace />
                ) : (
                  <LoginView onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />

            <Route 
              path="/signup" 
              element={
                user ? (
                  <Navigate to={user.role === 'Investor' ? '/investor-dashboard' : '/entrepreneur-dashboard'} replace />
                ) : (
                  <SignupView onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />

            {/* Protected Entrepreneur Boardroom */}
            <Route 
              path="/entrepreneur-dashboard" 
              element={
                user && user.role === 'Entrepreneur' ? (
                  <EntrepreneurDashboard user={user} token={token || ''} onUpdateUser={handleUpdateUser} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Protected Investor Boardroom */}
            <Route 
              path="/investor-dashboard" 
              element={
                user && user.role === 'Investor' ? (
                  <InvestorDashboard user={user} token={token || ''} onUpdateUser={handleUpdateUser} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Catch all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-mono">
          <p>© 2026 Nexus Collaboration Engine. Standard Sandboxed Ledger Protocol. SEC/FINRA Bypassed.</p>
        </footer>

      </div>
    </BrowserRouter>
  );
}

// Landing page Hero component
function LandingHero() {
  return (
    <div className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* Visual background gradients */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-100 to-emerald-100 opacity-40"></div>
      </div>

      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full text-blue-600 text-xs font-semibold">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>MERN Sandbox Collaboration Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 font-sans">
          Connecting Hardtech Startups with Capital Real-Time
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Nexus is a secure transactional workspace enabling early-stage deeptech founders to list fractionalized asset offerings, negotiate legal covenants via versioned electronic signature documents, schedule pitch sessions with anti-conflict calendars, and carry out instant WebRTC video board reviews.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all flex items-center space-x-1 shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>Get Onboarded</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/login"
            className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
          >
            <span>Enter Workspace</span>
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Scheduled Boardroom */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl w-fit border border-blue-100">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-sans font-bold text-lg">Anti-Conflict Scheduler</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            Prevents meeting double-bookings for both investors and startup teams using synchronized database validation calendars.
          </p>
        </div>

        {/* Legal Vault */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl w-fit border border-blue-100">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-sans font-bold text-lg">Signed legal covenants</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            Draw electronic signatures on HTML5 coordinate canvasses to bind convertible agreements, updating system version numbers on lock.
          </p>
        </div>

        {/* Ledger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl w-fit border border-blue-100">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-sans font-bold text-lg">Sovereign Ledger Sandbox</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            Simulates a secure ledger system, letting investors checkout fractionalized startup assets and transfer funds instantly to company owners.
          </p>
        </div>

      </div>

    </div>
  );
}
