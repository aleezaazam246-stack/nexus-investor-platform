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
  Plus, 
  Trash2, 
  RefreshCw, 
  Video, 
  CreditCard, 
  ArrowUpRight, 
  Briefcase 
} from 'lucide-react';

interface EntrepreneurDashboardProps {
  user: User;
  token: string;
  onUpdateUser: (updatedUser: User) => void;
}

export default function EntrepreneurDashboard({ user, token, onUpdateUser }: EntrepreneurDashboardProps) {
  // State elements
  const [products, setProducts] = useState<Product[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UI state managers
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'meetings' | 'documents' | 'payments'>('overview');
  const [videoMeeting, setVideoMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [newProd, setNewProd] = useState({ title: '', description: '', price: '', category: 'Equity Token', stock: '10' });
  const [depositAmount, setDepositAmount] = useState('10000');
  const [withdrawAmount, setWithdrawAmount] = useState('5000');

  // Fetch full dashboard payload
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, mRes, dRes, tRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/meetings', { headers }),
        fetch('/api/documents', { headers }),
        fetch('/api/payments/transactions', { headers })
      ]);

      if (!pRes.ok || !mRes.ok || !dRes.ok || !tRes.ok) {
        throw new Error('Failed to retrieve full MERN sandbox dataset');
      }

      const pData: Product[] = await pRes.json();
      const mData: Meeting[] = await mRes.json();
      const dData: Document[] = await dRes.json();
      const tData: Transaction[] = await tRes.json();

      setProducts(pData.filter(p => p.creatorId === user.id));
      setMeetings(mData);
      setDocuments(dData);
      setTransactions(tData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  // Form: Create Product listing
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, description, price, category, stock } = newProd;
    if (!title || !description || !price || !stock) return;

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          stock: Number(stock)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setProducts([...products, data]);
      setNewProd({ title: '', description: '', price: '', category: 'Equity Token', stock: '10' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete product listing
  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not delete listing');

      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Scheduler action: Accept meeting
  const handleAcceptMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Accepted' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMeetings(meetings.map(m => m.id === meetingId ? data : m));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Scheduler action: Reject meeting
  const handleRejectMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Rejected' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMeetings(meetings.map(m => m.id === meetingId ? data : m));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Document Chamber: Upload note
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

  // Document Chamber: Bind Canvas signature
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

  // Banking Sandbox: Process Deposit
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

      // Sync active parent user balance
      const syncedUser = { ...user, balance: data.newBalance };
      onUpdateUser(syncedUser);
      setTransactions([data.transaction, ...transactions]);
      setDepositAmount('10000');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Banking Sandbox: Process Withdrawal
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
      setWithdrawAmount('5000');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Compute stats helper
  const totalFundingTarget = user.profile.fundingTarget || 500000;
  const currentInvestmentReceived = transactions
    .filter(t => t.type === 'Transfer' && t.recipientId === user.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const targetPercentage = Math.min(100, Math.floor((currentInvestmentReceived / totalFundingTarget) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50 text-slate-800 min-h-screen">
      
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Nexus Sandbox Control Desk
          </span>
          <h1 className="text-3xl font-bold font-sans text-slate-900 tracking-tight mt-1 flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600 mr-2.5 shrink-0" />
            {user.profile.companyName || 'My Startup Workspace'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
            {user.profile.bio}
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
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold cursor-pointer font-mono text-rose-600 ml-4 hover:text-rose-500">Dismiss</button>
        </div>
      )}

      {/* STAT COUNTERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Ledger Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Business balance</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-2xl sm:text-3xl text-emerald-600">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold font-mono">Simulated Platform Ledger</p>
          </div>
        </div>

        {/* Funding Received */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Venture Funding Raised</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-2xl sm:text-3xl text-slate-900">
              ${currentInvestmentReceived.toLocaleString('en-US')}
            </h3>
            <div className="mt-2 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${targetPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                <span>{targetPercentage}% of Target</span>
                <span>Goal: ${totalFundingTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Boardrooms */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Scheduled Boardrooms</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-3xl text-slate-900">
              {meetings.filter(m => m.status === 'Accepted').length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              {meetings.filter(m => m.status === 'Pending').length} Pending Requests
            </p>
          </div>
        </div>

        {/* Secured versioned notes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans uppercase font-bold tracking-wider">Legal Agreements</span>
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

      {/* TABS SELECTOR */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        {(['overview', 'inventory', 'meetings', 'documents', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 font-sans font-semibold text-xs sm:text-sm tracking-wide border-b-2 transition-all cursor-pointer uppercase ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-bold bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview panel */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Join Conference shortcut if meetings are active */}
          {meetings.some(m => m.status === 'Accepted') && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-blue-900 font-sans font-bold text-base">Venture Video Feed is Active</h4>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Your scheduled pitch meeting with an interested investor is ready to launch. Connect via secure WebRTC.
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

          {/* Quick meeting view */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-sans text-slate-900">Upcoming Venture Bookings</h2>
            <MeetingCalendar
              meetings={meetings}
              currentUser={user}
              onAcceptMeeting={handleAcceptMeeting}
              onRejectMeeting={handleRejectMeeting}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Inventory & Equity Assets */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Creator form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base">Add New Equity / Product Offering</h3>
              <p className="text-slate-500 text-xs">
                Offer fractionalized equity tokens, advisory licenses, or hardware dev kits directly to platform investors.
              </p>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Offering Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Aether Fusion Token Series B"
                    value={newProd.title}
                    onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Asset Class Category</label>
                    <select
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    >
                      <option>Equity Token</option>
                      <option>Hardware Access</option>
                      <option>Consulting</option>
                      <option>Intellectual Property</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Unit Price ($)</label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Available Supply</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Strategic Description</label>
                  <textarea
                    placeholder="Describe how this asset fits into your business milestones."
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>List Offering Asset</span>
                </button>
              </form>
            </div>
          </div>

          {/* Listings view */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-sans font-semibold text-slate-900 text-base">Your Active Pitch Catalog Holdings</h3>
            {products.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No asset offerings published. Build some listings on the builder form to raise capital.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-all">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded text-blue-600 font-bold uppercase tracking-wider">
                          {p.category}
                        </span>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-slate-900 font-sans font-bold text-sm">{p.title}</h4>
                      <p className="text-slate-500 text-xs line-clamp-2">{p.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-mono">Stock: <strong className="text-slate-700">{p.stock}</strong></span>
                      <span className="font-mono font-bold text-emerald-600">${p.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Meetings Planner */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-slate-900 text-base">Strategic Boardroom Planner</h3>
          <MeetingCalendar
            meetings={meetings}
            currentUser={user}
            onAcceptMeeting={handleAcceptMeeting}
            onRejectMeeting={handleRejectMeeting}
          />
        </div>
      )}

      {/* TAB CONTENT: Electronic Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <DocChamber
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onSignDocument={handleSignDocument}
          />
        </div>
      )}

      {/* TAB CONTENT: Sandbox Payments Ledger */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sandbox wire transfers */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base flex items-center">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                Stripe Ledger Wire Simulator
              </h3>
              <p className="text-slate-500 text-xs">
                Nexus simulates secure platform transactions. Move funds immediately to clear convertible notes or purchase equipment.
              </p>

              {/* Deposit */}
              <form onSubmit={handleDeposit} className="space-y-2 border-b border-slate-100 pb-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Deposit Funds ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1 shadow-xs"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Wire Deposit</span>
                  </button>
                </div>
              </form>

              {/* Withdrawal */}
              <form onSubmit={handleWithdraw} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Withdraw Funds ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Ledger History logs */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-slate-900 text-base">Ledger Activity Statement</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No ledger movements recorded.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1 space-y-2">
                  {transactions.map((tx) => {
                    const isIncoming = tx.type === 'Deposit' || (tx.type === 'Transfer' && tx.recipientId === user.id);
                    return (
                      <div key={tx.id} className="pt-3 flex items-center justify-between text-xs font-sans">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-medium">{tx.details}</p>
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

    </div>
  );
}
