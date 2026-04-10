// Frontend/src/pages/admin/features/WithdrawalsPage.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Search, Filter, Download, X, Eye,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowUpCircle, RefreshCw, Building2, Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import withdrawalService from "@/pages/admin/features/WithdrawalService"

interface BankDetails { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string }
interface EWalletDetails { walletId: string; type: string }
interface Withdrawal {
  _id: string
  user: { _id: string; firstname: string; lastname: string; email: string; avatar?: string }
  account: { _id: string; mt5Account: string; accountType: string }
  amount: number
  paymentMethod: string
  bankDetails?: BankDetails
  eWalletDetails?: EWalletDetails
  requestedDate: string
  status: string
  remarks?: string
  approvedDate?: string
  rejectedDate?: string
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    Approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    Pending:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  }
  const c = cfg[status] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children, maxWidth = 540 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: number
}) => {
  if (!open) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--theme-bg-card)', borderRadius: 20,
              border: '1px solid var(--theme-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
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

const DRow = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
    <span style={{ fontSize: 13, color: 'var(--theme-text-primary)', fontWeight: 500 }}>
      {value || <span style={{ color: 'var(--theme-text-disabled)' }}>—</span>}
    </span>
  </div>
)

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectRemarks, setRejectRemarks] = useState("")
  const [approvalRemarks] = useState("Congratulations")
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<string[]>([])
  const [planTypeOptions, setPlanTypeOptions] = useState<string[]>([])
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [processingWithdrawals, setProcessingWithdrawals] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => { fetchWithdrawals() }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const data = await withdrawalService.getAllWithdrawals()
      const safeData = (data || []).map((w: any) => ({
        ...w,
        user: w.user || { firstname: '', lastname: '', email: '', _id: '' },
        account: w.account || { mt5Account: '', accountType: '', _id: '' },
      }))
      setWithdrawals(safeData)
      setStatusOptions([...new Set(safeData.map((w: Withdrawal) => w.status as string))] as string[])
      setPaymentMethodOptions([...new Set(safeData.map((w: Withdrawal) => w.paymentMethod))] as string[])
      setPlanTypeOptions([...new Set(safeData.map((w: Withdrawal) => w.account?.accountType).filter(Boolean))] as string[])
    } catch {
      toast.error('Failed to fetch withdrawals')
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const filtered = (() => {
    let f = [...(withdrawals || [])]
    if (searchTerm) {
      f = f.filter(w => {
        const name = `${w.user?.firstname || ''} ${w.user?.lastname || ''}`.toLowerCase()
        return name.includes(searchTerm.toLowerCase()) ||
          (w.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.account?.mt5Account || '').toLowerCase().includes(searchTerm.toLowerCase())
      })
    }
    if (selectedStatus) f = f.filter(w => w.status === selectedStatus)
    if (selectedPaymentMethod) f = f.filter(w => w.paymentMethod === selectedPaymentMethod)
    if (selectedPlanType) f = f.filter(w => w.account?.accountType === selectedPlanType)
    if (startDate && endDate) {
      f = f.filter(w => {
        const d = new Date(w.requestedDate)
        return d >= new Date(startDate) && d <= new Date(endDate)
      })
    }
    if (sortField) {
      f.sort((a, b) => {
        let av: any, bv: any
        if (sortField === 'amount') { av = a.amount; bv = b.amount }
        else if (sortField === 'status') { av = a.status; bv = b.status }
        else if (sortField === 'date') { av = new Date(a.requestedDate).getTime(); bv = new Date(b.requestedDate).getTime() }
        else { av = (a as any)[sortField]; bv = (b as any)[sortField] }
        return sortDirection === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
      })
    }
    return f
  })()

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

  const handleApprove = async (withdrawalId: string) => {
    try {
      setProcessingWithdrawals(prev => new Set(prev).add(withdrawalId))
      setIsApproving(true)
      await withdrawalService.approveWithdrawal(withdrawalId, { remarks: approvalRemarks })
      setWithdrawals(prev => prev.map(w => w._id === withdrawalId
        ? { ...w, status: 'Approved', approvedDate: new Date().toISOString(), remarks: approvalRemarks }
        : w))
      toast.success('Withdrawal approved successfully')
    } catch (error: any) {
      toast.error('Failed to approve withdrawal ' + (error.response?.data?.message || ''))
    } finally {
      setIsApproving(false)
      setProcessingWithdrawals(prev => { const n = new Set(prev); n.delete(withdrawalId); return n })
    }
  }

  const handleReject = async (withdrawalId: string) => {
    if (!rejectRemarks.trim()) { toast.error('Remarks are required for rejection'); return }
    try {
      setProcessingWithdrawals(prev => new Set(prev).add(withdrawalId))
      setIsRejecting(true)
      await withdrawalService.rejectWithdrawal(withdrawalId, { remarks: rejectRemarks })
      setWithdrawals(prev => prev.map(w => w._id === withdrawalId
        ? { ...w, status: 'Rejected', rejectedDate: new Date().toISOString(), remarks: rejectRemarks }
        : w))
      setRejectDialogOpen(false)
      setRejectRemarks("")
      toast.success('Withdrawal rejected')
    } catch {
      toast.error('Failed to reject withdrawal')
    } finally {
      setIsRejecting(false)
      setProcessingWithdrawals(prev => { const n = new Set(prev); n.delete(withdrawalId); return n })
    }
  }

  const handleExport = (format: string) => {
    try {
      setShowExport(false)
      const filteredData = filtered.map(w => ({
        ...w,
        account: { ...w.account, balance: (w.account as any).balance ?? 0 }
      }))
      withdrawalService.exportWithdrawals(filteredData, format)
      toast.success(`Withdrawals exported as ${format.toUpperCase()} successfully`)
    } catch {
      toast.error(`Failed to export as ${format}`)
    }
  }

  const resetFilters = () => {
    setSearchTerm(""); setSelectedStatus(null); setSelectedPaymentMethod(null)
    setSelectedPlanType(null); setStartDate(null); setEndDate(null); setCurrentPage(1)
  }

  const activeFilters = [selectedStatus, selectedPaymentMethod, selectedPlanType, startDate || endDate].filter(Boolean).length
  const pending = withdrawals.filter(w => w.status === 'Pending').length
  const approved = withdrawals.filter(w => w.status === 'Approved').length
  const totalAmount = withdrawals.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 4 }}>Withdrawal Management</h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>Review and process all withdrawal requests</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={fetchWithdrawals}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 13, height: 13 }} />Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Requests', value: withdrawals.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Pending', value: pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Approved', value: approved, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Approved Volume', value: `$${totalAmount.toLocaleString()}`, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }}
            style={{ borderRadius: 14, padding: '14px 16px', background: s.bg, border: `1px solid ${s.color}25` }}
          >
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', margin: 0 }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter & Search Bar ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--theme-text-disabled)' }} />
            <input type="text" placeholder="Search by name, email, account…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: 14, borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', outline: 'none', fontSize: 13, color: 'var(--theme-text-primary)', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${showFilters ? '#6366f1' : 'var(--theme-border)'}`, background: showFilters ? 'rgba(99,102,241,0.1)' : 'var(--theme-bg-main)', color: showFilters ? '#6366f1' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 13, height: 13 }} />Filters
            {activeFilters > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExport(!showExport)}
              style={{ height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download style={{ width: 13, height: 13 }} />Export
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 160, zIndex: 50, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  {[{ f: 'xlsx', label: 'Excel (.xlsx)', color: '#10b981' }, { f: 'pdf', label: 'PDF (.pdf)', color: '#ef4444' }, { f: 'csv', label: 'CSV (.csv)', color: '#6366f1' }].map(e => (
                    <button key={e.f} onClick={() => handleExport(e.f)}
                      style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={el => (el.currentTarget.style.background = 'var(--theme-bg-main)')}
                      onMouseLeave={el => (el.currentTarget.style.background = 'none')}>
                      <ArrowUpCircle style={{ width: 13, height: 13, color: e.color }} />{e.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid var(--theme-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Status', value: selectedStatus, options: statusOptions, onChange: (v: string | null) => { setSelectedStatus(v); setCurrentPage(1) } },
                    { label: 'Payment Method', value: selectedPaymentMethod, options: paymentMethodOptions, onChange: (v: string | null) => { setSelectedPaymentMethod(v); setCurrentPage(1) } },
                    { label: 'Account Type', value: selectedPlanType, options: planTypeOptions, onChange: (v: string | null) => { setSelectedPlanType(v); setCurrentPage(1) } },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                      <select value={f.value || 'all'} onChange={e => f.onChange(e.target.value === 'all' ? null : e.target.value)}
                        style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none' }}>
                        <option value="all">All {f.label}s</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>From Date</label>
                    <input type="date" value={startDate || ''} onChange={e => { setStartDate(e.target.value || null); setCurrentPage(1) }}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>To Date</label>
                    <input type="date" value={endDate || ''} onChange={e => { setEndDate(e.target.value || null); setCurrentPage(1) }}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={resetFilters}
                    style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X style={{ width: 12, height: 12 }} />Reset All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeFilters > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Active:</span>
            {[
              { v: selectedStatus, label: `Status: ${selectedStatus}`, clear: () => setSelectedStatus(null), color: '#6366f1' },
              { v: selectedPaymentMethod, label: `Method: ${selectedPaymentMethod}`, clear: () => setSelectedPaymentMethod(null), color: '#10b981' },
              { v: selectedPlanType, label: `Type: ${selectedPlanType}`, clear: () => setSelectedPlanType(null), color: '#f59e0b' },
            ].filter(c => c.v).map(c => (
              <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: `${c.color}18`, color: c.color, fontSize: 11, fontWeight: 600 }}>
                {c.label}<X style={{ width: 10, height: 10, cursor: 'pointer' }} onClick={c.clear} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--theme-bg-main)' }}>
                {[
                  { key: 'user', label: 'User' }, { key: 'account', label: 'Account' },
                  { key: 'amount', label: 'Amount', sortable: true }, { key: 'plan', label: 'Plan' },
                  { key: 'paymentMethod', label: 'Payment' }, { key: 'date', label: 'Requested', sortable: true },
                  { key: 'status', label: 'Status', sortable: true }, { key: 'actions', label: 'Actions' },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => (col as any).sortable && handleSort(col.key)}
                    style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', cursor: (col as any).sortable ? 'pointer' : 'default', borderBottom: '1px solid var(--theme-border)' }}>
                    {col.label}
                    {(col as any).sortable && sortField === col.key && <span style={{ marginLeft: 4 }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[90, 70, 50, 60, 70, 80, 60, 50].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 12, borderRadius: 6, background: 'var(--theme-border)', width: w, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <ArrowUpCircle style={{ width: 40, height: 40, color: 'var(--theme-border)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', margin: 0 }}>No withdrawals found</p>
                  {activeFilters > 0 && <button onClick={resetFilters} style={{ marginTop: 8, fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>}
                </td></tr>
              ) : paginated.map((w, idx) => (
                <motion.tr key={w._id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-bg-main)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{w.user.firstname} {w.user.lastname}</div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{w.user.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)', fontFamily: 'monospace' }}>{w.account.mt5Account}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>${w.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600 }}>{w.account.accountType}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>{w.paymentMethod}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(w.requestedDate)}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="View Details" onClick={() => { setSelectedWithdrawal(w); setDetailsOpen(true) }}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-muted)' }}>
                        <Eye style={{ width: 13, height: 13 }} />
                      </button>
                      {w.status === 'Pending' && (
                        <>
                          <button title="Approve" onClick={() => handleApprove(w._id)} disabled={processingWithdrawals.has(w._id) || isApproving}
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', opacity: processingWithdrawals.has(w._id) ? 0.5 : 1 }}>
                            <CheckCircle style={{ width: 13, height: 13 }} />
                          </button>
                          <button title="Reject" onClick={() => { setSelectedWithdrawal(w); setRejectDialogOpen(true) }} disabled={processingWithdrawals.has(w._id)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', opacity: processingWithdrawals.has(w._id) ? 0.5 : 1 }}>
                            <XCircle style={{ width: 13, height: 13 }} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--theme-border)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
              {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 11, outline: 'none' }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft style={{ width: 14, height: 14, color: 'var(--theme-text-muted)' }} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i
                if (page < 1 || page > totalPages) return null
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${page === currentPage ? '#6366f1' : 'var(--theme-border)'}`, background: page === currentPage ? '#6366f1' : 'var(--theme-bg-main)', color: page === currentPage ? 'white' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {page}
                  </button>
                )
              })}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight style={{ width: 14, height: 14, color: 'var(--theme-text-muted)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Details Modal ────────────────────────────────────────────────── */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth={580}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Withdrawal Details</h3>
            <button onClick={() => setDetailsOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
        </div>
        {selectedWithdrawal && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <DRow label="Client Name" value={`${selectedWithdrawal.user.firstname} ${selectedWithdrawal.user.lastname}`} />
              <DRow label="Email" value={selectedWithdrawal.user.email} />
              <DRow label="MT5 Account" value={selectedWithdrawal.account.mt5Account} />
              <DRow label="Amount" value={`$${selectedWithdrawal.amount.toLocaleString()}`} />
              <DRow label="Account Type" value={selectedWithdrawal.account.accountType} />
              <DRow label="Payment Method" value={selectedWithdrawal.paymentMethod?.toUpperCase()} />
              <DRow label="Status" value={<StatusBadge status={selectedWithdrawal.status} />} />
              <DRow label="Requested Date" value={formatDate(selectedWithdrawal.requestedDate)} />
              {selectedWithdrawal.approvedDate && <DRow label="Approved Date" value={formatDate(selectedWithdrawal.approvedDate)} />}
              {selectedWithdrawal.rejectedDate && <DRow label="Rejected Date" value={formatDate(selectedWithdrawal.rejectedDate)} />}
              {selectedWithdrawal.remarks && <div style={{ gridColumn: '1/-1' }}><DRow label="Remarks" value={selectedWithdrawal.remarks} /></div>}
            </div>

            {/* Payment Details Section */}
            <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {selectedWithdrawal.paymentMethod === 'bank'
                  ? <Building2 style={{ width: 15, height: 15, color: '#6366f1' }} />
                  : <Wallet style={{ width: 15, height: 15, color: '#f59e0b' }} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Details</span>
              </div>
              {selectedWithdrawal.paymentMethod === 'bank' && selectedWithdrawal.bankDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DRow label="Bank Name" value={selectedWithdrawal.bankDetails.bankName} />
                  <DRow label="Account Holder" value={selectedWithdrawal.bankDetails.accountHolderName} />
                  <DRow label="Account Number" value={selectedWithdrawal.bankDetails.accountNumber} />
                  <DRow label="IFSC Code" value={selectedWithdrawal.bankDetails.ifscCode} />
                </div>
              ) : selectedWithdrawal.eWalletDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DRow label="Wallet Type" value={selectedWithdrawal.eWalletDetails.type?.toUpperCase()} />
                  <DRow label="Wallet ID" value={selectedWithdrawal.eWalletDetails.walletId} />
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--theme-text-disabled)' }}>No payment details available</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      <Modal open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth={440}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(239,68,68,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle style={{ width: 18, height: 18, color: '#ef4444' }} />Reject Withdrawal
            </h3>
            <button onClick={() => setRejectDialogOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          {selectedWithdrawal && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedWithdrawal.user.firstname} {selectedWithdrawal.user.lastname} — ${selectedWithdrawal.amount.toLocaleString()}</p>}
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
              Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} rows={4} placeholder="Provide a clear reason…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${rejectRemarks.trim() ? 'var(--theme-border)' : 'rgba(239,68,68,0.4)'}`, background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setRejectDialogOpen(false)}
              style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => selectedWithdrawal && handleReject(selectedWithdrawal._id)} disabled={isRejecting || !rejectRemarks.trim()}
              style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (isRejecting || !rejectRemarks.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <XCircle style={{ width: 14, height: 14 }} />Reject
            </button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </motion.div>
  )
}

export default WithdrawalsPage
