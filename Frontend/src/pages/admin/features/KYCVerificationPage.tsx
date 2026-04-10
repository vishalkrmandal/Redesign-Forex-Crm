import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, RotateCcw, Search, Eye, RefreshCw, User, Mail, Phone,
  MapPin, Calendar, GraduationCap, Briefcase, Building2, Wallet, FileText,
  ShieldCheck, ShieldAlert, ShieldX, X, AlertTriangle, Clock, Filter
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface KYCRequest {
  id: string; userId: string; firstname: string; lastname: string; email: string; phone: string;
  country: { name: string; state: string };
  dateofbirth: string; kycStatus: string; kycRequestedAt: string;
  educationLevel: string; isEmployed: boolean;
  idDocument: string; address1Document: string; address2Document: string;
  bankDetails: { bankName: string; accountHolderName: string; accountNumber: string; ifscSwiftCode: string };
  walletDetails: { tetherWalletAddress: string; ethWalletAddress: string; accountNumber: string; trxWalletAddress: string };
  pendingUpdates: Array<{ updateType: string; updatedAt: string; status: string }>;
}

type StatusFilter = 'all' | 'unverified' | 'verified' | 'rejected';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  verified: { icon: ShieldCheck, label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  rejected: { icon: ShieldX, label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  unverified: { icon: ShieldAlert, label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
};

const FILTER_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'unverified', label: 'Pending', color: '#f59e0b' },
  { key: 'verified', label: 'Verified', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: 'all', label: 'All', color: '#6366f1' },
];

const openDocument = (path: string) => {
  if (!path) return;
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}/${path.replace(/\\/g, '/')}`;
  window.open(url, '_blank');
};

const formatDate = (d: string) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getInitials = (first: string, last: string) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';

// ─── Document Preview ──────────────────────────────────────────────────────────
const DocPreview = ({ path, label }: { path: string; label: string }) => {
  if (!path) return null;
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}/${path.replace(/\\/g, '/')}`;
  const isPdf = path.toLowerCase().endsWith('.pdf');
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-disabled)' }}>{label}</p>
      {isPdf ? (
        <button onClick={() => openDocument(path)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
          <FileText className="w-3.5 h-3.5" />View PDF
        </button>
      ) : (
        <div className="rounded-xl overflow-hidden cursor-pointer group relative"
          style={{ border: '1px solid var(--theme-border)', maxHeight: 160 }}
          onClick={() => openDocument(path)}>
          <img src={url} alt={label} className="w-full h-40 object-cover block"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

// ─── KYC Request Card ─────────────────────────────────────────────────────────
const KYCCard = ({ request, onView, onVerify, onReject, onUnverify }: {
  request: KYCRequest;
  onView: () => void;
  onVerify: () => void;
  onReject: () => void;
  onUnverify: () => void;
}) => {
  const cfg = STATUS_CONFIG[request.kycStatus] || STATUS_CONFIG.unverified;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{ background: 'var(--theme-bg-card)', border: `1px solid ${cfg.border}` }}
      onClick={onView}>
      {/* Top accent line */}
      <div className="h-1" style={{ background: cfg.color }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
            style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})` }}>
            {getInitials(request.firstname, request.lastname)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {request.firstname} {request.lastname}
            </p>
            <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              <Mail className="w-3 h-3 flex-shrink-0" />{request.email}
            </p>
          </div>
          <StatusBadge status={request.kycStatus} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {request.country?.name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--theme-text-disabled)' }} />
              <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{request.country.name}</p>
            </div>
          )}
          {request.kycRequestedAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--theme-text-disabled)' }} />
              <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                {new Date(request.kycRequestedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Doc indicators */}
        <div className="flex items-center gap-1.5 mb-3">
          {[request.idDocument, request.address1Document, request.address2Document].map((doc, i) => (
            <div key={i} className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: doc ? 'rgba(16,185,129,0.15)' : 'var(--theme-bg-main)', border: `1px solid ${doc ? 'rgba(16,185,129,0.4)' : 'var(--theme-border)'}` }}>
              <FileText className="w-3 h-3" style={{ color: doc ? '#10b981' : 'var(--theme-text-disabled)' }} />
            </div>
          ))}
          <p className="text-[10px] ml-1" style={{ color: 'var(--theme-text-disabled)' }}>Documents</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
            <Eye className="w-3.5 h-3.5" />View
          </button>

          {request.kycStatus === 'unverified' && (
            <>
              <button onClick={onVerify}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />Verify
              </button>
              <button onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                <XCircle className="w-3.5 h-3.5" />Reject
              </button>
            </>
          )}
          {(request.kycStatus === 'verified' || request.kycStatus === 'rejected') && (
            <button onClick={onUnverify}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
              <RotateCcw className="w-3.5 h-3.5" />Reset
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const KYCVerificationPage = () => {
  const [kycRequests, setKycRequests] = useState<KYCRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unverified');
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [unverifyDialogOpen, setUnverifyDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('superAdminToken');
    const sessionId = sessionStorage.getItem('sessionId');
    const sessionToken = sessionStorage.getItem('sessionToken');
    return { Authorization: `Bearer ${token}`, 'x-session-id': sessionId || '', 'x-session-token': sessionToken || '' };
  };

  useEffect(() => { fetchKYCRequests(); }, []);

  useEffect(() => {
    let filtered = kycRequests;
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.kycStatus === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.firstname.toLowerCase().includes(q) || r.lastname.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, kycRequests]);

  const fetchKYCRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/kyc`, { headers: authHeaders() });
      if (res.data.success) setKycRequests(res.data.data);
    } catch {
      toast.error('Failed to fetch KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await axios.put(`${API_BASE_URL}/api/admin/kyc/${selectedRequest.id}/verify`, {}, { headers: authHeaders() });
      if (res.data.success) { toast.success('KYC verified'); setVerifyDialogOpen(false); setDetailOpen(false); fetchKYCRequests(); }
    } catch { toast.error('Failed to verify KYC'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    try {
      setActionLoading(true);
      const res = await axios.put(`${API_BASE_URL}/api/admin/kyc/${selectedRequest.id}/reject`, { rejectionReason }, { headers: authHeaders() });
      if (res.data.success) { toast.success('KYC rejected'); setRejectDialogOpen(false); setRejectionReason(''); setDetailOpen(false); fetchKYCRequests(); }
    } catch { toast.error('Failed to reject KYC'); }
    finally { setActionLoading(false); }
  };

  const handleUnverify = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await axios.put(`${API_BASE_URL}/api/admin/kyc/${selectedRequest.id}/unverify`, {}, { headers: authHeaders() });
      if (res.data.success) { toast.success('KYC reset to unverified'); setUnverifyDialogOpen(false); setDetailOpen(false); fetchKYCRequests(); }
    } catch { toast.error('Failed to reset KYC'); }
    finally { setActionLoading(false); }
  };

  const getCount = (s: string) => s === 'all' ? kycRequests.length : kycRequests.filter(r => r.kycStatus === s).length;

  return (
    <div className="space-y-6" style={{ minHeight: '100vh' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>KYC Verification</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Review and manage customer verification requests</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={fetchKYCRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 self-start sm:self-auto"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
          <RefreshCw className="w-4 h-4" />Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: getCount('all'), color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Pending', count: getCount('unverified'), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Verified', count: getCount('verified'), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Rejected', count: getCount('rejected'), color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
              <span className="text-lg font-bold" style={{ color: stat.color }}>
                {stat.count > 99 ? '99+' : stat.count}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-text-disabled)' }} />
          <input
            placeholder="Search by name or email…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = 'var(--theme-border)')}
          />
        </div>
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--theme-bg-main)' }}>
          <Filter className="w-3.5 h-3.5 ml-2" style={{ color: 'var(--theme-text-disabled)' }} />
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? tab.color : 'transparent',
                  color: isActive ? 'white' : 'var(--theme-text-muted)',
                }}>
                {tab.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--theme-border)', color: isActive ? 'white' : 'var(--theme-text-disabled)' }}>
                  {getCount(tab.key)}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Cards Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading requests…</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <ShieldAlert className="w-12 h-12 mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-muted)' }}>No KYC requests found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-disabled)' }}>Try adjusting your search or filter</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRequests.map(request => (
            <KYCCard
              key={request.id} request={request}
              onView={() => { setSelectedRequest(request); setDetailOpen(true); }}
              onVerify={() => { setSelectedRequest(request); setVerifyDialogOpen(true); }}
              onReject={() => { setSelectedRequest(request); setRejectDialogOpen(true); }}
              onUnverify={() => { setSelectedRequest(request); setUnverifyDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* ── Detail Side Panel ────────────────────────────────────────────────── */}
      {createPortal(<AnimatePresence>
        {detailOpen && selectedRequest && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setDetailOpen(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{ background: 'var(--theme-bg-card)', borderLeft: '1px solid var(--theme-border)' }}>

              {/* Panel header */}
              <div className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3"
                style={{ background: 'var(--theme-bg-card)', borderBottom: '1px solid var(--theme-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${STATUS_CONFIG[selectedRequest.kycStatus]?.color || '#6366f1'}cc, ${STATUS_CONFIG[selectedRequest.kycStatus]?.color || '#6366f1'})` }}>
                  {getInitials(selectedRequest.firstname, selectedRequest.lastname)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>{selectedRequest.firstname} {selectedRequest.lastname}</p>
                  <StatusBadge status={selectedRequest.kycStatus} />
                </div>
                <button onClick={() => setDetailOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                  <X className="w-4 h-4" style={{ color: 'var(--theme-text-primary)' }} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Personal Info */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                  <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                    <User className="w-4 h-4" style={{ color: '#6366f1' }} />
                    <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Personal Information</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name', value: `${selectedRequest.firstname} ${selectedRequest.lastname}`, icon: User },
                      { label: 'Email', value: selectedRequest.email, icon: Mail },
                      { label: 'Phone', value: selectedRequest.phone, icon: Phone },
                      { label: 'Country', value: selectedRequest.country?.name, icon: MapPin },
                      { label: 'Date of Birth', value: selectedRequest.dateofbirth ? new Date(selectedRequest.dateofbirth).toLocaleDateString() : 'N/A', icon: Calendar },
                      { label: 'Education', value: selectedRequest.educationLevel || 'N/A', icon: GraduationCap },
                      { label: 'Employment', value: selectedRequest.isEmployed ? 'Employed' : 'Unemployed', icon: Briefcase },
                      { label: 'Requested', value: formatDate(selectedRequest.kycRequestedAt), icon: Clock },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--theme-text-disabled)' }}>{item.label}</p>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                {(selectedRequest.idDocument || selectedRequest.address1Document || selectedRequest.address2Document) && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                      <FileText className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>KYC Documents</p>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                      {selectedRequest.idDocument && <DocPreview path={selectedRequest.idDocument} label="ID Document" />}
                      {selectedRequest.address1Document && <DocPreview path={selectedRequest.address1Document} label="Address Proof 1" />}
                      {selectedRequest.address2Document && <DocPreview path={selectedRequest.address2Document} label="Address Proof 2" />}
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {selectedRequest.bankDetails?.bankName && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                      <Building2 className="w-4 h-4" style={{ color: '#6366f1' }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Bank Details</p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {[
                        { label: 'Bank Name', value: selectedRequest.bankDetails.bankName },
                        { label: 'Account Holder', value: selectedRequest.bankDetails.accountHolderName },
                        { label: 'Account Number', value: selectedRequest.bankDetails.accountNumber },
                        { label: 'IFSC/SWIFT', value: selectedRequest.bankDetails.ifscSwiftCode },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--theme-text-disabled)' }}>{item.label}</p>
                          <p className="text-sm font-medium font-mono truncate" style={{ color: 'var(--theme-text-primary)' }}>{item.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet Details */}
                {selectedRequest.walletDetails && (selectedRequest.walletDetails.tetherWalletAddress || selectedRequest.walletDetails.ethWalletAddress || selectedRequest.walletDetails.trxWalletAddress) && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Wallet Details</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        { label: 'USDT (Tether)', value: selectedRequest.walletDetails.tetherWalletAddress, color: '#26a17b' },
                        { label: 'Ethereum (ETH)', value: selectedRequest.walletDetails.ethWalletAddress, color: '#627eea' },
                        { label: 'TRON (TRX)', value: selectedRequest.walletDetails.trxWalletAddress, color: '#ef0027' },
                      ].filter(w => w.value).map(w => (
                        <div key={w.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: w.color }}>{w.label}</p>
                          <p className="text-xs font-mono break-all" style={{ color: 'var(--theme-text-primary)' }}>{w.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Updates */}
                {selectedRequest.pendingUpdates && selectedRequest.pendingUpdates.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' }}>
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-bold text-amber-600">Pending Updates ({selectedRequest.pendingUpdates.length})</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {selectedRequest.pendingUpdates.map((update, i) => (
                        <div key={i} className="flex items-center justify-between pl-3 py-1.5 rounded-lg"
                          style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(245,158,11,0.06)' }}>
                          <span className="text-sm font-medium capitalize" style={{ color: 'var(--theme-text-primary)' }}>
                            {update.updateType.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--theme-text-disabled)' }}>{formatDate(update.updatedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {selectedRequest.kycStatus === 'unverified' && (
                    <>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setVerifyDialogOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        <CheckCircle2 className="w-4 h-4" />Verify KYC
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setRejectDialogOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                        <XCircle className="w-4 h-4" />Reject
                      </motion.button>
                    </>
                  )}
                  {(selectedRequest.kycStatus === 'verified' || selectedRequest.kycStatus === 'rejected') && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setUnverifyDialogOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                      <RotateCcw className="w-4 h-4" />Reset to Pending
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}

      {/* ── Verify Confirmation ────────────────────────────────────────────── */}
      {createPortal(<AnimatePresence>
        {verifyDialogOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>Verify KYC</p>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{selectedRequest.firstname} {selectedRequest.lastname}</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                This will approve the KYC for this user. They will be notified and gain full account access.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setVerifyDialogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleVerify} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  {actionLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : <><CheckCircle2 className="w-4 h-4" />Verify</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* ── Reject Dialog ─────────────────────────────────────────────────── */}
      {createPortal(<AnimatePresence>
        {rejectDialogOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <ShieldX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>Reject KYC</p>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{selectedRequest.firstname} {selectedRequest.lastname}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>Rejection Reason *</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejection…" rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                  style={{ background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = '#ef4444')}
                  onBlur={e => (e.target.style.borderColor = 'var(--theme-border)')} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                  {actionLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Rejecting…</> : <><XCircle className="w-4 h-4" />Reject</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* ── Unverify Dialog ────────────────────────────────────────────────── */}
      {createPortal(<AnimatePresence>
        {unverifyDialogOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <RotateCcw className="w-6 h-6" style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>Reset to Pending</p>
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{selectedRequest.firstname} {selectedRequest.lastname}</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                This will reset the KYC status to pending, requiring another review.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setUnverifyDialogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleUnverify} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {actionLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</> : <><RotateCcw className="w-4 h-4" />Reset</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
};

export default KYCVerificationPage;
