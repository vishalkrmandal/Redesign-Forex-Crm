import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { toast } from 'sonner'
import {
  DollarSign, Eye, CheckCircle, XCircle, Clock, Search,
  RefreshCw, Building2, Wallet, User, Mail, Globe, X, Check,
  AlertTriangle, Hash, FileText
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface WithdrawalRequest {
  _id: string
  userId: {
    _id: string
    firstname: string
    lastname: string
    email: string
    country?: { name: string }
    phone?: string
  }
  ibConfigurationId: {
    _id: string
    IBbalance: number
    referralCode: string
    level: number
  }
  amount: number
  withdrawalMethod: string
  bankDetails?: {
    bankName: string
    accountHolderName: string
    accountNumber: string
    ifscSwiftCode: string
  }
  walletDetails?: {
    walletType: string
    walletAddress: string
  }
  status: string
  createdAt: string
  processedAt?: string
  rejectedReason?: string
  adminNotes?: string
  transactionId?: string
  approvedBy?: {
    firstname: string
    lastname: string
  }
}

interface WithdrawalStats {
  totalRequests: number
  totalAmount: number
  byStatus: {
    [key: string]: { count: number; amount: number }
  }
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, width = 560 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; width?: number
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: 20
          }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--theme-bg-card)', borderRadius: 16,
              border: '1px solid var(--theme-border)', width: '100%', maxWidth: width,
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function ModalHeader({ title, subtitle, onClose, icon, color = '#6366f1' }: {
  title: string; subtitle?: string; onClose: () => void; icon?: React.ReactNode; color?: string
}) {
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && (
          <div style={{ width: 38, height: 38, borderRadius: 9, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 32, height: 32, borderRadius: 8, border: '1px solid var(--theme-border)',
        background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
      >
        <X size={15} />
      </button>
    </div>
  )
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: '#f59e0b', bg: '#f59e0b18', icon: <Clock size={13} />, label: 'Pending' },
  approved: { color: '#10b981', bg: '#10b98118', icon: <CheckCircle size={13} />, label: 'Approved' },
  rejected: { color: '#ef4444', bg: '#ef444418', icon: <XCircle size={13} />, label: 'Rejected' },
}

const formatDate = (d: string) => new Date(d).toLocaleString()

const IBWithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [stats, setStats] = useState<WithdrawalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [rejectedReason, setRejectedReason] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      if (!token) { toast.error('Authentication token not found'); return }
      const [wRes, sRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/ib-withdrawals?status=${statusFilter}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/admin/ib-withdrawals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (wRes.data.success) setWithdrawals(wRes.data.withdrawals)
      if (sRes.data.success) setStats(sRes.data.stats)
    } catch { toast.error('Failed to load withdrawal data') }
    finally { setLoading(false) }
  }

  const openDetailsDialog = async (withdrawal: WithdrawalRequest) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/api/admin/ib-withdrawals/${withdrawal._id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) { setSelectedWithdrawal(res.data.withdrawal); setDetailsDialogOpen(true) }
    } catch { toast.error('Failed to load withdrawal details') }
  }

  const handleApprove = async () => {
    if (!selectedWithdrawal) return
    try {
      setProcessing(selectedWithdrawal._id)
      const token = localStorage.getItem('adminToken')
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/ib-withdrawals/${selectedWithdrawal._id}/approve`,
        { adminNotes, transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        toast.success('Withdrawal approved successfully')
        setApproveDialogOpen(false); setDetailsDialogOpen(false)
        setAdminNotes(''); setTransactionId('')
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
    } finally { setProcessing(null) }
  }

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectedReason.trim()) { toast.error('Please provide a rejection reason'); return }
    try {
      setProcessing(selectedWithdrawal._id)
      const token = localStorage.getItem('adminToken')
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/ib-withdrawals/${selectedWithdrawal._id}/reject`,
        { rejectedReason, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        toast.success('Withdrawal rejected successfully')
        setRejectDialogOpen(false); setDetailsDialogOpen(false)
        setRejectedReason(''); setAdminNotes('')
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
    } finally { setProcessing(null) }
  }

  const filteredWithdrawals = withdrawals.filter(w =>
    w.userId.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userId.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.ibConfigurationId.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s'
  }

  const statCards = [
    { label: 'Total Requests', value: stats?.totalRequests || 0, sub: `$${(stats?.totalAmount || 0).toFixed(2)} total`, icon: <DollarSign size={20} />, color: '#6366f1' },
    { label: 'Pending', value: stats?.byStatus.pending?.count || 0, sub: `$${(stats?.byStatus.pending?.amount || 0).toFixed(2)}`, icon: <Clock size={20} />, color: '#f59e0b' },
    { label: 'Approved', value: stats?.byStatus.approved?.count || 0, sub: `$${(stats?.byStatus.approved?.amount || 0).toFixed(2)}`, icon: <CheckCircle size={20} />, color: '#10b981' },
    { label: 'Rejected', value: stats?.byStatus.rejected?.count || 0, sub: `$${(stats?.byStatus.rejected?.amount || 0).toFixed(2)}`, icon: <XCircle size={20} />, color: '#ef4444' },
  ]

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={24} style={{ color: '#10b981' }} />IB Withdrawal Management
            </h1>
            <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', marginTop: 4 }}>Review and process IB commission withdrawal requests</p>
          </div>
          <button onClick={fetchData} style={{
            ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)'
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
          >
            <RefreshCw size={14} />Refresh
          </button>
        </div>

        {/* Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {statCards.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{
                background: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)',
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 1 }}>{s.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search + Filter Bar */}
        <div style={{
          background: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)',
          padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-muted)' }} />
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or referral code…"
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)',
                color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
            />
          </div>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'pending', 'approved', 'rejected'].map(s => {
              const cfg = s === 'all' ? { color: '#6366f1', bg: '#6366f118' } : { color: statusConfig[s]?.color || '#6366f1', bg: (statusConfig[s]?.color || '#6366f1') + '18' }
              const active = statusFilter === s
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? cfg.color + '60' : 'var(--theme-border)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--theme-text-muted)',
                  transition: 'all .15s', textTransform: 'capitalize'
                }}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['User', 'IB Balance', 'Amount', 'Method', 'Date', 'Status', 'Actions'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: 'rgba(255,255,255,0.02)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}>
                          <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '50px', textAlign: 'center' }}>
                      <DollarSign size={40} style={{ color: 'var(--theme-text-disabled)', margin: '0 auto 12px', display: 'block' }} />
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--theme-text-muted)' }}>No withdrawal requests found</div>
                      <div style={{ fontSize: 13, color: 'var(--theme-text-disabled)', marginTop: 4 }}>Withdrawal requests will appear here</div>
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((w, idx) => {
                    const sc = statusConfig[w.status] || { color: '#6366f1', bg: '#6366f118', icon: <AlertTriangle size={13} />, label: w.status }
                    return (
                      <motion.tr key={w._id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        onMouseEnter={() => setHoveredRow(w._id)} onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderBottom: '1px solid var(--theme-border)',
                          background: hoveredRow === w._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'background .15s'
                        }}
                      >
                        {/* User */}
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                              {w.userId.firstname} {w.userId.lastname}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={11} />{w.userId.email}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--theme-text-disabled)', marginTop: 2 }}>
                              Ref: {w.ibConfigurationId.referralCode}
                            </div>
                          </div>
                        </td>
                        {/* IB Balance */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                            ${w.ibConfigurationId.IBbalance.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Available</div>
                        </td>
                        {/* Amount */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            ${w.amount.toFixed(2)}
                          </div>
                        </td>
                        {/* Method */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: w.withdrawalMethod === 'bank' ? '#6366f118' : '#f59e0b18',
                            color: w.withdrawalMethod === 'bank' ? '#6366f1' : '#f59e0b'
                          }}>
                            {w.withdrawalMethod === 'bank' ? <Building2 size={12} /> : <Wallet size={12} />}
                            {w.withdrawalMethod.charAt(0).toUpperCase() + w.withdrawalMethod.slice(1)}
                          </span>
                        </td>
                        {/* Date */}
                        <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>
                          {formatDate(w.createdAt)}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                            borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: sc.bg, color: sc.color
                          }}>
                            {sc.icon}{sc.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openDetailsDialog(w)} style={{
                              width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
                            }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f118'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f160' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {w.status === 'pending' && (
                              <>
                                <button onClick={() => { setSelectedWithdrawal(w); setApproveDialogOpen(true) }}
                                  disabled={processing === w._id}
                                  style={{
                                    width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s',
                                    opacity: processing === w._id ? 0.5 : 1
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#10b98118'; (e.currentTarget as HTMLButtonElement).style.color = '#10b981'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#10b98160' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                                  title="Approve"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => { setSelectedWithdrawal(w); setRejectDialogOpen(true) }}
                                  disabled={processing === w._id}
                                  style={{
                                    width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s',
                                    opacity: processing === w._id ? 0.5 : 1
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444418'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef444460' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                                  title="Reject"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Details Modal ─────────────────────────────────────────────────────── */}
      <Modal open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} width={640}>
        <ModalHeader
          title="Withdrawal Details"
          subtitle={selectedWithdrawal ? `${selectedWithdrawal.userId.firstname} ${selectedWithdrawal.userId.lastname}` : ''}
          onClose={() => setDetailsDialogOpen(false)}
          icon={<Eye size={17} />}
          color="#6366f1"
        />
        {selectedWithdrawal && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Status + Method */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(() => {
                const sc = statusConfig[selectedWithdrawal.status] || { color: '#6366f1', bg: '#6366f118', icon: <AlertTriangle size={13} />, label: selectedWithdrawal.status }
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>
                    {sc.icon}{sc.label}
                  </span>
                )
              })()}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: selectedWithdrawal.withdrawalMethod === 'bank' ? '#6366f118' : '#f59e0b18',
                color: selectedWithdrawal.withdrawalMethod === 'bank' ? '#6366f1' : '#f59e0b'
              }}>
                {selectedWithdrawal.withdrawalMethod === 'bank' ? <Building2 size={13} /> : <Wallet size={13} />}
                {selectedWithdrawal.withdrawalMethod.charAt(0).toUpperCase() + selectedWithdrawal.withdrawalMethod.slice(1)}
              </span>
            </div>

            {/* User + IB Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: '14px 16px', border: '1px solid var(--theme-border)' }}>
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>User Information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={13} style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                      {selectedWithdrawal.userId.firstname} {selectedWithdrawal.userId.lastname}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={12} style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedWithdrawal.userId.email}</span>
                  </div>
                  {selectedWithdrawal.userId.country && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe size={12} style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedWithdrawal.userId.country.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: '14px 16px', border: '1px solid var(--theme-border)' }}>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>IB Information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Referral Code</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', fontFamily: 'monospace' }}>{selectedWithdrawal.ibConfigurationId.referralCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Level</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>Level {selectedWithdrawal.ibConfigurationId.level}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>IB Balance</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>${selectedWithdrawal.ibConfigurationId.IBbalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: '14px 16px', border: '1px solid var(--theme-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Withdrawal Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Amount</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', marginTop: 3 }}>${selectedWithdrawal.amount.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Request Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', marginTop: 3 }}>{formatDate(selectedWithdrawal.createdAt)}</div>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Processed</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', marginTop: 3 }}>{formatDate(selectedWithdrawal.processedAt)}</div>
                  </div>
                )}
                {selectedWithdrawal.transactionId && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Transaction ID</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-primary)', fontFamily: 'monospace', marginTop: 3 }}>{selectedWithdrawal.transactionId}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            {selectedWithdrawal.withdrawalMethod === 'bank' && selectedWithdrawal.bankDetails && (
              <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 11, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={13} />Bank Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { l: 'Bank Name', v: selectedWithdrawal.bankDetails.bankName },
                    { l: 'Account Holder', v: selectedWithdrawal.bankDetails.accountHolderName },
                    { l: 'Account Number', v: selectedWithdrawal.bankDetails.accountNumber, mono: true },
                    { l: 'IFSC / SWIFT', v: selectedWithdrawal.bankDetails.ifscSwiftCode, mono: true },
                  ].map(f => (
                    <div key={f.l}>
                      <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{f.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', marginTop: 3, fontFamily: f.mono ? 'monospace' : 'inherit' }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Details */}
            {selectedWithdrawal.withdrawalMethod === 'wallet' && selectedWithdrawal.walletDetails && (
              <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 11, padding: '14px 16px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={13} />Wallet Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Wallet Type</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', marginTop: 3, textTransform: 'capitalize' }}>{selectedWithdrawal.walletDetails.walletType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Wallet Address</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--theme-text-primary)', marginTop: 3, fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedWithdrawal.walletDetails.walletAddress}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes / Rejection */}
            {selectedWithdrawal.adminNotes && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--theme-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Admin Notes</div>
                <div style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>{selectedWithdrawal.adminNotes}</div>
              </div>
            )}
            {selectedWithdrawal.rejectedReason && (
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Rejection Reason</div>
                <div style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>{selectedWithdrawal.rejectedReason}</div>
              </div>
            )}
          </div>
        )}
        {/* Footer actions for pending */}
        {selectedWithdrawal?.status === 'pending' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDetailsDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Close</button>
            <button onClick={() => { setApproveDialogOpen(true) }} style={{ ...btnBase, background: '#10b98118', color: '#10b981', border: '1px solid #10b98140' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#10b98130'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#10b98118'}
            >
              <CheckCircle size={14} />Approve
            </button>
            <button onClick={() => { setRejectDialogOpen(true) }} style={{ ...btnBase, background: '#ef444418', color: '#ef4444', border: '1px solid #ef444440' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#ef444430'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ef444418'}
            >
              <XCircle size={14} />Reject
            </button>
          </div>
        )}
        {selectedWithdrawal?.status !== 'pending' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setDetailsDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Close</button>
          </div>
        )}
      </Modal>

      {/* ── Approve Modal ─────────────────────────────────────────────────────── */}
      <Modal open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} width={480}>
        <ModalHeader title="Approve Withdrawal" subtitle={`$${selectedWithdrawal?.amount.toFixed(2)}`} onClose={() => setApproveDialogOpen(false)} icon={<CheckCircle size={17} />} color="#10b981" />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>Withdrawal Amount</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>${selectedWithdrawal?.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>Available IB Balance</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)' }}>${selectedWithdrawal?.ibConfigurationId.IBbalance.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Hash size={12} />Transaction ID (optional)
            </label>
            <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter transaction ID"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={12} />Admin Notes (optional)
            </label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add any notes…" rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
            />
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setApproveDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Cancel</button>
          <button onClick={handleApprove} disabled={processing === selectedWithdrawal?._id} style={{
            ...btnBase, background: '#10b981', color: '#fff', opacity: processing === selectedWithdrawal?._id ? 0.6 : 1
          }}
            onMouseEnter={e => { if (!processing)(e.currentTarget as HTMLButtonElement).style.background = '#059669' }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#10b981'}
          >
            {processing === selectedWithdrawal?._id ? (
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            ) : <CheckCircle size={15} />}
            {processing === selectedWithdrawal?._id ? 'Processing…' : 'Approve Withdrawal'}
          </button>
        </div>
      </Modal>

      {/* ── Reject Modal ──────────────────────────────────────────────────────── */}
      <Modal open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} width={480}>
        <ModalHeader title="Reject Withdrawal" subtitle={`$${selectedWithdrawal?.amount.toFixed(2)}`} onClose={() => setRejectDialogOpen(false)} icon={<XCircle size={17} />} color="#ef4444" />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', gap: 10 }}>
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Amount: ${selectedWithdrawal?.amount.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 3 }}>This will permanently reject the withdrawal request.</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
              Rejection Reason *
            </label>
            <textarea value={rejectedReason} onChange={e => setRejectedReason(e.target.value)} placeholder="Please provide a reason for rejection…" rows={3} required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${rejectedReason ? 'var(--theme-border)' : 'rgba(239,68,68,0.4)'}`, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = rejectedReason ? 'var(--theme-border)' : 'rgba(239,68,68,0.4)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={12} />Admin Notes (optional)
            </label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Additional notes…" rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
            />
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setRejectDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Cancel</button>
          <button onClick={handleReject}
            disabled={processing === selectedWithdrawal?._id || !rejectedReason.trim()}
            style={{ ...btnBase, background: '#ef4444', color: '#fff', opacity: (processing === selectedWithdrawal?._id || !rejectedReason.trim()) ? 0.5 : 1 }}
            onMouseEnter={e => { if (!processing && rejectedReason)(e.currentTarget as HTMLButtonElement).style.background = '#dc2626' }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'}
          >
            {processing === selectedWithdrawal?._id ? (
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            ) : <XCircle size={15} />}
            {processing === selectedWithdrawal?._id ? 'Processing…' : 'Reject Withdrawal'}
          </button>
        </div>
      </Modal>
    </>
  )
}

export default IBWithdrawalManagement
