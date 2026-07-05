/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, Briefcase, TrendingUp, DollarSign, Menu, X } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900 transition-colors">
                NEXUS
              </span>
            </Link>
          </div>

          {/* Center Links based on Role */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <span className="text-slate-500 text-sm">Role:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'Investor' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {user.role === 'Investor' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <Briefcase className="h-3 w-3 mr-1" />
                  )}
                  {user.role}
                </span>

                <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center border border-slate-200">
                  <DollarSign className="h-4 w-4 text-emerald-600 mr-0.5" />
                  <span className="font-mono text-sm font-semibold text-emerald-600">
                    {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1.5 uppercase tracking-wider font-semibold">Ledger Balance</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to={user.role === 'Investor' ? '/investor-dashboard' : '/entrepreneur-dashboard'}
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-x-3">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-2 pt-2 pb-4 space-y-1">
          {user ? (
            <div className="px-3 py-3 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Account:</span>
                <span className="text-sm font-semibold truncate text-slate-700">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Role:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user.role === 'Investor' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Ledger Balance</span>
                <div className="flex items-center">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-mono text-sm font-semibold text-emerald-600">
                    {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex flex-col space-y-2">
                <Link
                  to={user.role === 'Investor' ? '/investor-dashboard' : '/entrepreneur-dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-center py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center justify-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-xl text-sm font-medium border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 px-3 py-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-slate-600 hover:text-slate-900 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
