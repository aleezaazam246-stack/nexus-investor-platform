/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Product, Meeting, Document, Transaction } from '../types';
import MeetingCalendar from '../components/MeetingCalendar';
import VideoChamber from '../components/VideoChamber';
import DocChamber from '../components/DocChamber';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar, 
  ShoppingCart, 
  CreditCard, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  AlertCircle,
  Video
} from 'lucide-react';

interface InvestorDashboardProps {
  user: User;
  token: string;
  onUpdateUser: (updatedUser: User) => void;
}

export default function InvestorDashboard({ user, token, onUpdateUser }: InvestorDashboardProps) {
  // Database states
  const [products, setProducts] = useState<Product[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targetUsers, setTargetUsers] = useState<any[]>([]);

  // UI state managers
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'meetings' | 'documents' | 'payments'>('overview');
  const [videoMeeting, setVideoMeeting] = useState<Meeting | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<Product | null>(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms
  const [scheduleForm, setScheduleForm] = useState({ title: '', date: '', time: '', guestId: '' });
  const [depositAmount, setDepositAmount] = useState('50000');
  const [withdrawAmount, setWithdrawAmount] = useState('20000');

  // Fetch full dataset
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, mRes, dRes, tRes, uRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/meetings', { headers }),
        fetch('/api/documents', { headers }),
        fetch('/api/payments/transactions', { headers }),
        fetch('/api/users/all', { headers })
      ]);

      if (!pRes.ok || !mRes.ok || !dRes.ok || !tRes.ok || !uRes.ok) {
        throw new Error('Failed to retrieve deep data stream');
      }

      const pData: Product[] = await pRes.json();
      const mData: Meeting[] = await mRes.json();
      const dData: Document[] = await dRes.json();
      const tData: Transaction[] = await tRes.json();
      const uData = await uRes.json();

      setProducts(pData);
      setMeetings(mData);
      setDocuments(dData);
      setTransactions(tData);
      setTargetUsers(uData.filter((u: any) => u.role === 'Entrepreneur'));
      
      // Auto-populate target guest selector
      const entrepreneurUsers = uData.filter((u: any) => u.role === 'Entrepreneur');
      if (entrepreneurUsers.length > 0 && !scheduleForm.guestId) {
        setScheduleForm(prev => ({ ...prev, guestId: entrepreneurUsers[0].id }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  // Catalog purchase: Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const subtotal = checkoutItem.price * checkoutQty;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{
            productId: checkoutItem.id,
            price: checkoutItem.price,
            quantity: checkoutQty
          }],
          totalAmount: subtotal
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Success sync
      const syncedUser = { ...user, balance: data.newBalance };
      onUpdateUser(syncedUser);
      setSuccessMsg(`Successfully acquired ${checkoutQty} equity unit of "${checkoutItem.title}"! Portfolio balance updated.`);
      setCheckoutItem(null);
      setCheckoutQty(1);
      
      // Refresh database records
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Scheduler: Submit pitch invite
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, date, time, guestId } = scheduleForm;
    if (!title || !date || !time || !guestId) {
      setError('Please fill in all scheduler criteria.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, date, time, guestId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scheduling error.');
      }

      setMeetings([...meetings, data]);
      setSuccessMsg(`Pitch Meeting "${title}" scheduled successfully. Conflict checker reported clean timeline.`);
      setScheduleForm({ title: '', date: '', time: '', guestId: targetUsers[0]?.id || '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Document upload helper
  const handleUploadDocument = async (name: string) => {
    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setDocuments([...documents, data]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Document signing helper
  const handleSignDocument = async (id: string, signatureBase64: string) => {
    try {
      const response = await fetch('/api/documents/sign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: id, signatureData: signatureBase64 })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setDocuments(documents.map(d => d.id === id ? data : d));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Banking: Wire Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    try {
      const response = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(depositAmount) })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const syncedUser = { ...user, balance: data.newBalance };
      onUpdateUser(syncedUser);
      setTransactions([data.transaction, ...transactions]);
      setDepositAmount('50000');
      setSuccessMsg(`Successfully wired $${Number(depositAmount).toLocaleString()} into platform sandbox account.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Banking: Withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;

    try {
      const response = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const syncedUser = { ...user, balance: data.newBalance };
      onUpdateUser(syncedUser);
      setTransactions([data.transaction, ...transactions]);
      setWithdrawAmount('20000');
      setSuccessMsg(`Successfully withdrawn $${Number(withdrawAmount).toLocaleString()} to corporate bank vault.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Portfolio aggregates
  const activeEquityDeals = transactions.filter(t => t.type === 'Transfer' && t.userId === user.id);
  const totalCapitalAllocated = activeEquityDeals.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50 text-slate-800 min-h-screen">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Nexus Sovereign Investor Hub
          </span>
          <h1 className="text-3xl font-bold font-sans text-slate-900 tracking-tight mt-1 flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mr-2.5 shrink-0" />
            {user.profile.companyName || 'Genesis Capital Syndicate'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
            {user.profile.investmentThesis}
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="self-start inline-flex items-center space-x-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-xs cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Ledger Engine</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-150 text-rose-600 p-4 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold cursor-pointer font-mono ml-4 hover:text-rose-500">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-150 text-emerald-700 p-4 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold cursor-pointer font-mono ml-4 hover:text-emerald-600 font-sans">Dismiss</button>
        </div>
      )}

      {/* INVESTMENT METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Available Dry Powder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Dry Powder Balance</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-2xl sm:text-3xl text-emerald-600">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Ready Sandbox Allocation Cash</p>
          </div>
        </div>

        {/* Capital Deployed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Capital Allocated</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-2xl sm:text-3xl text-slate-900">
              ${totalCapitalAllocated.toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              {activeEquityDeals.length} Deals Completed
            </p>
          </div>
        </div>

        {/* Booked Boardrooms */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Meetings Booked</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-3xl text-slate-900">
              {meetings.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              {meetings.filter(m => m.status === 'Pending').length} Pending Invites
            </p>
          </div>
        </div>

        {/* Closed contracts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Executed Contracts</span>
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-3xl text-slate-900">
              {documents.filter(d => d.status === 'Signed').length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              {documents.filter(d => d.status === 'Pending').length} Pending Signature
            </p>
          </div>
        </div>

      </div>

      {/* DASHBOARD TAB CONTROLS */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        {(['overview', 'catalog', 'meetings', 'documents', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 font-sans font-semibold text-xs sm:text-sm tracking-wide border-b-2 transition-all cursor-pointer uppercase ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-bold bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-850'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview summary */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Active meeting signal */}
          {meetings.some(m => m.status === 'Accepted') && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-blue-950 font-sans font-bold text-base">Secured Boardroom Is Connected</h4>
                <p className="text-slate-600 text-xs sm:text-sm">
                  An accepted pitch schedule is active. Launch the real-time WebRTC conferencing stream.
                </p>
              </div>
              <button
                onClick={() => setVideoMeeting(meetings.find(m => m.status === 'Accepted') || null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Video className="h-4 w-4" />
                <span>Launch Video Chamber</span>
              </button>
            </div>
          )}

          {/* Table display */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-sans text-slate-900">Upcoming Venture Bookings</h2>
            <MeetingCalendar
              meetings={meetings}
              currentUser={user}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Startup catalog holdings */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-slate-900 text-lg">Browse Startup Offerings</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              Discover cutting-edge Deeptech and Greentech companies listing fractionalized equity, advisory contracts, and product licenses.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No startup products listed on the platform directory.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded text-blue-600 font-bold uppercase tracking-wider">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">Stock: {p.stock}</span>
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-sans font-bold text-base">{p.title}</h4>
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-3">{p.description}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Asset Unit Price</span>
                        <span className="font-mono font-bold text-emerald-600 text-base sm:text-lg">${p.price.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          setCheckoutItem(p);
                          setCheckoutQty(1);
                        }}
                        disabled={isOutOfStock}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-40 transition-all flex items-center space-x-1.5 shadow-xs"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Acquire'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Meetings & Scheduler */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Pitch invite Scheduler form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                Schedule Pitch Meeting
              </h3>
              <p className="text-slate-500 text-xs">
                Request a formal board review with your selected entrepreneur startup. Strict double-booking check runs immediately upon schedule click.
              </p>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Target Enterprise Startup</label>
                  <select
                    value={scheduleForm.guestId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, guestId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    required
                  >
                    {targetUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.profile?.companyName || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Meeting Title / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Series Seed Convertible Term Discussion"
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Schedule Date</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Schedule Time (UTC)</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1 shadow-xs"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Check Conflicts & Book Room</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Scheduled display list */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-sans font-semibold text-slate-900 text-base">Your Active Booking Timelines</h3>
            <MeetingCalendar
              meetings={meetings}
              currentUser={user}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Documents review chamber */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <DocChamber
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onSignDocument={handleSignDocument}
          />
        </div>
      )}

      {/* TAB CONTENT: Sandbox payment system */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Wire deposits forms */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base flex items-center">
                <CreditCard className="h-5 w-5 text-emerald-500 mr-2" />
                Ledger Funding Vault
              </h3>
              <p className="text-slate-500 text-xs">
                Acquire platform asset tokens directly. Add sandbox wiring funds easily to satisfy investment obligations.
              </p>

              {/* Deposit */}
              <form onSubmit={handleDeposit} className="space-y-2 border-b border-slate-100 pb-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Deposit dry powder ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="50000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1 shadow-xs"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Deposit Wire</span>
                  </button>
                </div>
              </form>

              {/* Withdraw */}
              <form onSubmit={handleWithdraw} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Withdraw dry powder ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="20000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    <span>Withdraw</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Logs */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base">Capital Ledger History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No capital ledger events.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1 space-y-2">
                  {transactions.map((tx) => {
                    const isIncoming = tx.type === 'Deposit';
                    return (
                      <div key={tx.id} className="pt-3 flex items-center justify-between text-xs font-sans">
                        <div className="space-y-0.5">
                          <p className="text-slate-850 font-medium">{tx.details}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: {tx.id} • {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`font-mono font-bold text-sm shrink-0 ml-4 ${
                          isIncoming ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isIncoming ? '+' : '-'}${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WEB RTC VIDEO LIGHTBOX MODAL */}
      {videoMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl relative">
            <VideoChamber
              meetingTitle={videoMeeting.title}
              onClose={() => setVideoMeeting(null)}
            />
            <button
              onClick={() => setVideoMeeting(null)}
              className="absolute top-4 right-4 bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white p-2.5 rounded-full cursor-pointer border border-slate-200 shadow-sm transition-all text-xs font-mono font-bold"
            >
              Close Chamber
            </button>
          </div>
        </div>
      )}

      {/* QUICK CHECKOUT SLIDER MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl p-6 space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="font-sans font-bold text-slate-900 text-base">Secure Checkout Ledger Allocation</h3>
              <button onClick={() => setCheckoutItem(null)} className="text-slate-400 hover:text-slate-800 cursor-pointer font-sans text-sm p-1">✖</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>Enterprise Issuer:</span>
                <span className="text-blue-600 font-semibold">Target Startup</span>
              </div>
              <h4 className="text-slate-900 font-sans font-bold text-sm">{checkoutItem.title}</h4>
              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{checkoutItem.description}</p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Allocation Units</label>
                <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCheckoutQty(Math.max(1, checkoutQty - 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-slate-900 w-8 text-center font-mono">{checkoutQty}</span>
                  <button
                    type="button"
                    onClick={() => setCheckoutQty(Math.min(checkoutItem.stock, checkoutQty + 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Unit Price:</span>
                  <span>${checkoutItem.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Subtotal Amount:</span>
                  <span>${(checkoutItem.price * checkoutQty).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-emerald-600 text-sm mt-1">
                  <span>Total Due (Ledger):</span>
                  <span>${(checkoutItem.price * checkoutQty).toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (checkoutItem.price * checkoutQty) > user.balance}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (checkoutItem.price * checkoutQty) > user.balance ? (
                  <span>Insufficient Dry Powder</span>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>Execute Asset Purchase</span>
                  </>
                )}
              </button>

              {(checkoutItem.price * checkoutQty) > user.balance && (
                <p className="text-[10px] text-center text-rose-500 font-mono leading-relaxed">
                  Top up Sandbox Cash in the "Payments" tab to make this investment.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
