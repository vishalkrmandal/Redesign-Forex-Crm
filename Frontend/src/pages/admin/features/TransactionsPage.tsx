// Frontend/src/pages/admin/features/TransactionsPage.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Search, Filter, X, Eye, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, ArrowLeftRight, RefreshCw,
} from "lucide-react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Transaction {
  id: string
  user: { name: string; email: string; avatar?: string }
  accountNumber?: string
  fromAccountNumber?: string
  toAccountNumber?: string
  amount: number
  paymentMethod: string
  type: 'Deposit' | 'Withdrawal' | 'Transfer'
  planType: string
  requestedOn: string
  completedOn?: string
  status: string
  bankDetails?: { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string }
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: string }) => {
  const cfg: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
    Deposit:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', Icon: TrendingUp },
    Withdrawal: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', Icon: TrendingDown },
    Transfer:   { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1', Icon: ArrowLeftRight },
  }
  const c = cfg[type] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', Icon: ArrowLeftRight }
  const Icon = c.Icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <Icon style={{ width: 11, height: 11 }} />{type}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    Approved:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    Completed: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    Pending:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Rejected:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  }
  const c = cfg[status] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }} />{status}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--theme-bg-card)', borderRadius: 20, border: '1px solid var(--theme-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
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

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)

  const fetchTransactions = async () => {
    try {
      setLoading(true); setError(null)
      const res = await axios.get<{ success: boolean; count: number; data: Transaction[] }>(
        `${API_BASE_URL}/api/admin/transactions`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      )
      setTransactions(res.data.data || [])
    } catch {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('desc') }
  }

  const formatDate = (d: string) => {
    if (!d) return 'N/A'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return 'Invalid Date' }
  }

  const filtered = transactions
    .filter(t => {
      if (searchTerm && !t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(t.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (selectedType && selectedType !== 'all' && t.type !== selectedType) return false
      if (selectedPlanType && !t.planType.toLowerCase().includes(selectedPlanType.toLowerCase())) return false
      if (selectedPaymentMethod && !t.paymentMethod.toLowerCase().includes(selectedPaymentMethod.toLowerCase())) return false
      if (startDate && endDate) {
        const d = new Date(t.requestedOn)
        const end = new Date(endDate); end.setHours(23, 59, 59)
        if (d < new Date(startDate) || d > end) return false
      }
      return true
    })
    .sort((a, b) => {
      if (!sortField) return 0
      let av: any, bv: any
      if (sortField === 'amount') { av = a.amount; bv = b.amount }
      else if (sortField === 'requestedOn') { av = new Date(a.requestedOn).getTime(); bv = new Date(b.requestedOn).getTime() }
      else if (sortField === 'completedOn') { av = a.completedOn ? new Date(a.completedOn).getTime() : 0; bv = b.completedOn ? new Date(b.completedOn).getTime() : 0 }
      else if (sortField === 'type') { av = a.type; bv = b.type }
      else return 0
      if (av < bv) return sortDirection === 'asc' ? -1 : 1
      if (av > bv) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const resetFilters = () => {
    setSearchTerm(""); setSelectedType(null); setSelectedPlanType(null)
    setSelectedPaymentMethod(null); setStartDate(null); setEndDate(null)
    setSortField(null); setCurrentPage(1)
  }

  const activeFilters = [selectedType, selectedPlanType, selectedPaymentMethod, startDate || endDate].filter(Boolean).length

  const uniqueTypes = [...new Set(transactions.map(t => t.type))]
  const uniquePlans = [...new Set(transactions.map(t => t.planType).filter(Boolean))]
  const uniqueMethods = [...new Set(transactions.map(t => t.paymentMethod).filter(Boolean))]

  // Summary counts
  const deposits = transactions.filter(t => t.type === 'Deposit').length
  const withdrawals = transactions.filter(t => t.type === 'Withdrawal').length
  const transfers = transactions.filter(t => t.type === 'Transfer').length

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 4 }}>Transaction History</h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>Complete audit log of all platform transactions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={fetchTransactions}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 13, height: 13 }} />Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: transactions.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Deposits', value: deposits, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Withdrawals', value: withdrawals, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Transfers', value: transfers, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
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
          {/* Quick type filter pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['Deposit', 'Withdrawal', 'Transfer'].map(t => {
              const colors: Record<string, string> = { Deposit: '#10b981', Withdrawal: '#ef4444', Transfer: '#6366f1' }
              const active = selectedType === t
              return (
                <button key={t} onClick={() => { setSelectedType(active ? null : t); setCurrentPage(1) }}
                  style={{ height: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${active ? colors[t] : 'var(--theme-border)'}`, background: active ? `${colors[t]}15` : 'var(--theme-bg-main)', color: active ? colors[t] : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {t}
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${showFilters ? '#6366f1' : 'var(--theme-border)'}`, background: showFilters ? 'rgba(99,102,241,0.1)' : 'var(--theme-bg-main)', color: showFilters ? '#6366f1' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 13, height: 13 }} />More
            {activeFilters > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid var(--theme-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Type', value: selectedType, options: uniqueTypes, onChange: (v: string | null) => { setSelectedType(v); setCurrentPage(1) } },
                    { label: 'Plan Type', value: selectedPlanType, options: uniquePlans, onChange: (v: string | null) => { setSelectedPlanType(v); setCurrentPage(1) } },
                    { label: 'Payment Method', value: selectedPaymentMethod, options: uniqueMethods, onChange: (v: string | null) => { setSelectedPaymentMethod(v); setCurrentPage(1) } },
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
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        {error && (
          <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <X style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--theme-bg-main)' }}>
                {[
                  { key: 'user', label: 'User' },
                  { key: 'accountNumber', label: 'Account' },
                  { key: 'amount', label: 'Amount', sortable: true },
                  { key: 'paymentMethod', label: 'Payment' },
                  { key: 'type', label: 'Type', sortable: true },
                  { key: 'planType', label: 'Plan' },
                  { key: 'requestedOn', label: 'Requested', sortable: true },
                  { key: 'completedOn', label: 'Completed', sortable: true },
                  { key: 'status', label: 'Status' },
                  { key: 'actions', label: '' },
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
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[90, 70, 50, 70, 60, 60, 80, 80, 60, 30].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 12, borderRadius: 6, background: 'var(--theme-border)', width: w, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <ArrowLeftRight style={{ width: 40, height: 40, color: 'var(--theme-border)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', margin: 0 }}>No transactions found</p>
                  {(searchTerm || activeFilters > 0) && <button onClick={resetFilters} style={{ marginTop: 8, fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>}
                </td></tr>
              ) : paginated.map((tx, idx) => (
                <motion.tr key={tx.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.015 }}
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-bg-main)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{tx.user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{tx.user.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', fontFamily: 'monospace' }}>
                    {tx.accountNumber || tx.fromAccountNumber || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: tx.type === 'Deposit' ? '#10b981' : tx.type === 'Withdrawal' ? '#ef4444' : '#6366f1' }}>
                    ${tx.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>{tx.paymentMethod}</td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge type={tx.type} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600 }}>{tx.planType || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(tx.requestedOn)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{tx.completedOn ? formatDate(tx.completedOn) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={tx.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => { setSelectedTransaction(tx); setDetailsOpen(true) }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-muted)' }}>
                      <Eye style={{ width: 13, height: 13 }} />
                    </button>
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
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedTransaction && <TypeBadge type={selectedTransaction.type} />}
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Transaction Details</h3>
            </div>
            <button onClick={() => setDetailsOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
        </div>
        {selectedTransaction && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DRow label="Client Name" value={selectedTransaction.user.name} />
              <DRow label="Email" value={selectedTransaction.user.email} />
              <DRow label="Account" value={selectedTransaction.accountNumber || selectedTransaction.fromAccountNumber} />
              {selectedTransaction.toAccountNumber && <DRow label="To Account" value={selectedTransaction.toAccountNumber} />}
              <DRow label="Amount" value={`$${selectedTransaction.amount.toLocaleString()}`} />
              <DRow label="Type" value={<TypeBadge type={selectedTransaction.type} />} />
              <DRow label="Payment Method" value={selectedTransaction.paymentMethod} />
              <DRow label="Plan Type" value={selectedTransaction.planType} />
              <DRow label="Status" value={<StatusBadge status={selectedTransaction.status} />} />
              <DRow label="Requested On" value={formatDate(selectedTransaction.requestedOn)} />
              {selectedTransaction.completedOn && <DRow label="Completed On" value={formatDate(selectedTransaction.completedOn)} />}
            </div>
            {selectedTransaction.bankDetails && (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--theme-border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Bank Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DRow label="Bank Name" value={selectedTransaction.bankDetails.bankName} />
                  <DRow label="Account Holder" value={selectedTransaction.bankDetails.accountHolderName} />
                  <DRow label="Account Number" value={selectedTransaction.bankDetails.accountNumber} />
                  <DRow label="IFSC Code" value={selectedTransaction.bankDetails.ifscCode} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </motion.div>
  )
}

export default TransactionsPage
