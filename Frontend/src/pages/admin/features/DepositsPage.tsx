// Frontend/src/pages/admin/features/DepositsPage.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Search, Filter, Download, X, FileText, Eye,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowDownCircle, RefreshCw, ExternalLink,
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Deposit {
  id: string
  user: { name: string; email: string }
  accountNumber: string
  amount: number
  planType: string
  paymentMethod: string
  bonus: number
  document: string | null
  requestedOn: string
  approvedOn?: string
  rejectedOn?: string
  status: string
  remarks?: string
  proofOfPayment?: string | null
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    Approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
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

// ─── Modal Backdrop ───────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children, maxWidth = 520 }: {
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

// ─── Detail Row ───────────────────────────────────────────────────────────────
const DRow = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </span>
    <span style={{ fontSize: 13, color: 'var(--theme-text-primary)', fontWeight: 500 }}>
      {value || <span style={{ color: 'var(--theme-text-disabled)' }}>—</span>}
    </span>
  </div>
)

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[90, 70, 50, 60, 70, 40, 40, 80, 60, 40].map((w, i) => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div style={{ height: 12, borderRadius: 6, background: 'var(--theme-border)', width: w, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
)

const DepositsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [sortField, setSortField] = useState("requestedOn")
  const [sortOrder, setSortOrder] = useState("desc")
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [bonus, setBonus] = useState(0)
  const [remarks, setRemarks] = useState("Congratulations")
  const [rejectRemarks, setRejectRemarks] = useState("")
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [planTypeOptions, setPlanTypeOptions] = useState<string[]>([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const getToken = () => localStorage.getItem('adminToken')
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1)
      else fetchDeposits()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    fetchDeposits()
  }, [selectedStatus, selectedPlanType, selectedPaymentMethod, startDate, endDate, sortField, sortOrder, currentPage, itemsPerPage])

  const fetchDeposits = async () => {
    try {
      setLoading(true); setError(null)
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedPlanType) params.append('planType', selectedPlanType)
      if (selectedPaymentMethod) params.append('paymentMethod', selectedPaymentMethod)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())
      params.append('sortField', sortField)
      params.append('sortOrder', sortOrder)
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      const response = await axios.get(`${API_BASE_URL}/api/admindeposits?${params.toString()}`, getAuthHeaders())
      const transformedData = response.data.data.map((item: any) => ({
        id: item._id,
        user: { name: item.user?.name || 'Unknown User', email: item.user?.email || 'No email' },
        accountNumber: item.accountNumber || 'N/A',
        amount: item.amount || 0,
        planType: item.planType || 'Unknown',
        paymentMethod: item.paymentMethod || 'Unknown',
        bonus: item.bonus || 0,
        document: item.proofOfPayment || item.document,
        requestedOn: item.requestedOn || item.createdAt,
        approvedOn: item.approvedOn,
        rejectedOn: item.rejectedOn,
        status: item.status || 'Pending',
        remarks: item.remarks || item.notes,
        proofOfPayment: item.proofOfPayment || item.document
      }))
      setDeposits(transformedData)
      setTotalItems(response.data.total || 0)
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage))
    } catch {
      setError('Failed to fetch deposits')
      setDeposits([])
      toast.error("Failed to load deposits. Please try refreshing.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (deposits.length > 0) {
      setStatusOptions([...new Set(deposits.map(d => d.status))].filter(Boolean))
      setPlanTypeOptions([...new Set(deposits.map(d => d.planType))].filter(Boolean))
      setPaymentMethodOptions([...new Set(deposits.map(d => d.paymentMethod))].filter(Boolean))
    }
  }, [deposits])

  const resetFilters = () => {
    setSearchTerm(""); setSelectedStatus(null); setSelectedPlanType(null)
    setSelectedPaymentMethod(null); setStartDate(null); setEndDate(null); setCurrentPage(1)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

  const handleSort = (field: keyof Deposit) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortOrder(field === "requestedOn" ? "desc" : "asc") }
    setCurrentPage(1)
  }

  const handleExport = async (format: string) => {
    try {
      setShowExport(false)
      const loadingToast = toast.loading(`Exporting ${format.toUpperCase()}...`)
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedPlanType) params.append('planType', selectedPlanType)
      if (selectedPaymentMethod) params.append('paymentMethod', selectedPaymentMethod)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())
      params.append('sortField', sortField); params.append('sortOrder', sortOrder); params.append('format', format)
      const response = await axios.get(`${API_BASE_URL}/api/admindeposits/export?${params.toString()}`, { responseType: 'blob', ...getAuthHeaders() })
      const contentDisposition = response.headers['content-disposition']
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      const filename = matches && matches[1] ? matches[1].replace(/['"]/g, '') : `deposits_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename)
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url)
      toast.dismiss(loadingToast); toast.success(`${format.toUpperCase()} exported successfully`)
    } catch { toast.error(`Failed to export ${format.toUpperCase()}.`) }
  }

  const openDetails = (deposit: Deposit) => { setSelectedDeposit(deposit); setDetailsOpen(true) }
  const openApprove = (deposit: Deposit) => { setSelectedDeposit(deposit); setBonus(0); setRemarks("Congratulations"); setApproveOpen(true) }
  const openReject = (deposit: Deposit) => { setSelectedDeposit(deposit); setRejectRemarks(""); setRejectOpen(true) }

  const openDocumentInNewTab = () => {
    if (selectedDeposit && (selectedDeposit.proofOfPayment || selectedDeposit.document)) {
      const documentPath = selectedDeposit.proofOfPayment || selectedDeposit.document
      const url = documentPath && documentPath.startsWith('http') ? documentPath : documentPath ? `${API_BASE_URL}${documentPath}` : ''
      if (url) window.open(url, '_blank')
      else toast.error("Failed to open document")
    }
  }

  const handleApprove = async () => {
    let loadingToast: any
    try {
      if (!selectedDeposit) return
      setApproveLoading(true); setApproveOpen(false); setSelectedDeposit(null)
      loadingToast = toast.loading("Processing approval...")
      const response = await axios.post(`${API_BASE_URL}/api/admindeposits/${selectedDeposit.id}/approve`, { bonus, remarks }, getAuthHeaders())
      const updatedDeposit = response.data.data
      setDeposits(prev => prev.map(dep => dep.id === selectedDeposit.id ? { ...dep, status: "Approved", approvedOn: updatedDeposit.approvedDate || new Date().toISOString(), bonus, remarks } : dep))
      toast.dismiss(loadingToast); toast.success("Deposit approved successfully")
    } catch {
      if (loadingToast) toast.dismiss(loadingToast); toast.error("Failed to approve deposit")
    } finally { setApproveLoading(false) }
  }

  const handleReject = async () => {
    let loadingToast: any
    try {
      if (!selectedDeposit) return
      if (!rejectRemarks.trim()) { toast.error("Please provide a reason for rejection."); return }
      setRejectLoading(true); setRejectOpen(false); setSelectedDeposit(null)
      loadingToast = toast.loading("Processing rejection...")
      await axios.post(`${API_BASE_URL}/api/admindeposits/${selectedDeposit.id}/reject`, { remarks: rejectRemarks }, getAuthHeaders())
      setDeposits(prev => prev.map(dep => dep.id === selectedDeposit.id ? { ...dep, status: "Rejected", rejectedOn: new Date().toISOString(), remarks: rejectRemarks } : dep))
      toast.dismiss(loadingToast); toast.success("Deposit rejected successfully.")
    } catch {
      if (loadingToast) toast.dismiss(loadingToast); toast.error("Failed to reject deposit.")
    } finally { setRejectLoading(false) }
  }

  const activeFilters = [selectedStatus, selectedPlanType, selectedPaymentMethod, startDate || endDate].filter(Boolean).length

  // ── Stats ──────────────────────────────────────────────────────────────────
  const pending = deposits.filter(d => d.status === 'Pending').length
  const approved = deposits.filter(d => d.status === 'Approved').length
  const totalAmount = deposits.filter(d => d.status === 'Approved').reduce((s, d) => s + d.amount, 0)

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 4 }}>
            Deposit Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>
            Review and process all incoming deposit requests
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => fetchDeposits()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10,
            border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)',
            color: 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} />
          Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats Strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Deposits', value: totalItems, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Pending', value: pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Approved', value: approved, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Approved Volume', value: `$${totalAmount.toLocaleString()}`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
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
      <div style={{
        background: 'var(--theme-bg-card)', borderRadius: 16,
        border: '1px solid var(--theme-border)', padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--theme-text-disabled)' }} />
            <input
              type="text" placeholder="Search by name, email, account…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', height: 40, paddingLeft: 38, paddingRight: 14, borderRadius: 10,
                border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)',
                outline: 'none', fontSize: 13, color: 'var(--theme-text-primary)', boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${showFilters ? '#6366f1' : 'var(--theme-border)'}`,
              background: showFilters ? 'rgba(99,102,241,0.1)' : 'var(--theme-bg-main)',
              color: showFilters ? '#6366f1' : 'var(--theme-text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Filter style={{ width: 13, height: 13 }} />
            Filters
            {activeFilters > 0 && (
              <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilters}
              </span>
            )}
          </button>
          {/* Export */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExport(!showExport)}
              style={{
                height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid var(--theme-border)',
                background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Download style={{ width: 13, height: 13 }} />
              Export
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 160, zIndex: 50,
                    background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)',
                    borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {[{ f: 'xlsx', label: 'Excel (.xlsx)', color: '#10b981' }, { f: 'csv', label: 'CSV (.csv)', color: '#6366f1' }, { f: 'pdf', label: 'PDF (.pdf)', color: '#ef4444' }].map(e => (
                    <button key={e.f} onClick={() => handleExport(e.f)}
                      style={{
                        width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none',
                        border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--theme-text-primary)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                      onMouseEnter={el => (el.currentTarget.style.background = 'var(--theme-bg-main)')}
                      onMouseLeave={el => (el.currentTarget.style.background = 'none')}
                    >
                      <FileText style={{ width: 13, height: 13, color: e.color }} />
                      {e.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid var(--theme-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Status', value: selectedStatus, options: statusOptions, onChange: (v: string | null) => { setSelectedStatus(v); setCurrentPage(1) } },
                    { label: 'Plan Type', value: selectedPlanType, options: planTypeOptions, onChange: (v: string | null) => { setSelectedPlanType(v); setCurrentPage(1) } },
                    { label: 'Payment Method', value: selectedPaymentMethod, options: paymentMethodOptions, onChange: (v: string | null) => { setSelectedPaymentMethod(v); setCurrentPage(1) } },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                      <select
                        value={f.value || 'all'}
                        onChange={e => f.onChange(e.target.value === 'all' ? null : e.target.value)}
                        style={{
                          width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
                          border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)',
                          color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none',
                        }}
                      >
                        <option value="all">All {f.label}s</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>From Date</label>
                    <input type="date" value={startDate ? startDate.toISOString().split('T')[0] : ''}
                      onChange={e => { setStartDate(e.target.value ? new Date(e.target.value) : null); setCurrentPage(1) }}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>To Date</label>
                    <input type="date" value={endDate ? endDate.toISOString().split('T')[0] : ''}
                      onChange={e => { setEndDate(e.target.value ? new Date(e.target.value) : null); setCurrentPage(1) }}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={resetFilters} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X style={{ width: 12, height: 12 }} /> Reset All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips */}
        {activeFilters > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Active:</span>
            {selectedStatus && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 11, fontWeight: 600 }}>
                Status: {selectedStatus}
                <X style={{ width: 10, height: 10, cursor: 'pointer' }} onClick={() => setSelectedStatus(null)} />
              </span>
            )}
            {selectedPlanType && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, fontWeight: 600 }}>
                Plan: {selectedPlanType}
                <X style={{ width: 10, height: 10, cursor: 'pointer' }} onClick={() => setSelectedPlanType(null)} />
              </span>
            )}
            {selectedPaymentMethod && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>
                Method: {selectedPaymentMethod}
                <X style={{ width: 10, height: 10, cursor: 'pointer' }} onClick={() => setSelectedPaymentMethod(null)} />
              </span>
            )}
          </div>
        )}
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
                  { key: 'user', label: 'User', sortable: false },
                  { key: 'accountNumber', label: 'Account', sortable: false },
                  { key: 'amount', label: 'Amount', sortable: true },
                  { key: 'planType', label: 'Plan', sortable: false },
                  { key: 'paymentMethod', label: 'Payment', sortable: false },
                  { key: 'bonus', label: 'Bonus', sortable: false },
                  { key: 'document', label: 'Doc', sortable: false },
                  { key: 'requestedOn', label: 'Requested', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'actions', label: 'Actions', sortable: false },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => col.sortable && handleSort(col.key as keyof Deposit)}
                    style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', cursor: col.sortable ? 'pointer' : 'default',
                      borderBottom: '1px solid var(--theme-border)',
                    }}
                  >
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                : deposits.length === 0
                  ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <ArrowDownCircle style={{ width: 40, height: 40, color: 'var(--theme-border)', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', margin: 0 }}>No deposits found</p>
                        {activeFilters > 0 && (
                          <button onClick={resetFilters} style={{ marginTop: 8, fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
                        )}
                      </td>
                    </tr>
                  )
                  : deposits.map((dep, idx) => (
                    <motion.tr key={dep.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      style={{ borderBottom: '1px solid var(--theme-border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-bg-main)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{dep.user.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{dep.user.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)', fontFamily: 'monospace' }}>{dep.accountNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>${dep.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600 }}>{dep.planType}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>{dep.paymentMethod}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: dep.bonus > 0 ? '#10b981' : 'var(--theme-text-disabled)', fontWeight: dep.bonus > 0 ? 700 : 400 }}>
                        {dep.bonus > 0 ? `+$${dep.bonus}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {dep.document ? (
                          <button
                            onClick={() => { setSelectedDeposit(dep); openDocumentInNewTab() }}
                            style={{ background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 8px', color: '#6366f1' }}
                          >
                            <ExternalLink style={{ width: 12, height: 12 }} />
                          </button>
                        ) : <span style={{ color: 'var(--theme-text-disabled)', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(dep.requestedOn)}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={dep.status} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button title="View Details" onClick={() => openDetails(dep)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-muted)' }}>
                            <Eye style={{ width: 13, height: 13 }} />
                          </button>
                          {dep.status === 'Pending' && (
                            <>
                              <button title="Approve" onClick={() => openApprove(dep)}
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                <CheckCircle style={{ width: 13, height: 13 }} />
                              </button>
                              <button title="Reject" onClick={() => openReject(dep)}
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                <XCircle style={{ width: 13, height: 13 }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && deposits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--theme-border)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
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
                let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i
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
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth={560}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Deposit Details</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>ID: {selectedDeposit?.id}</p>
            </div>
            <button onClick={() => setDetailsOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {selectedDeposit && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DRow label="Client Name" value={selectedDeposit.user.name} />
              <DRow label="Email" value={selectedDeposit.user.email} />
              <DRow label="Account Number" value={selectedDeposit.accountNumber} />
              <DRow label="Amount" value={`$${selectedDeposit.amount.toLocaleString()}`} />
              <DRow label="Plan Type" value={selectedDeposit.planType} />
              <DRow label="Payment Method" value={selectedDeposit.paymentMethod} />
              <DRow label="Bonus" value={selectedDeposit.bonus > 0 ? `$${selectedDeposit.bonus}` : 'None'} />
              <DRow label="Status" value={<StatusBadge status={selectedDeposit.status} />} />
              <DRow label="Requested On" value={formatDate(selectedDeposit.requestedOn)} />
              {selectedDeposit.approvedOn && <DRow label="Approved On" value={formatDate(selectedDeposit.approvedOn)} />}
              {selectedDeposit.rejectedOn && <DRow label="Rejected On" value={formatDate(selectedDeposit.rejectedOn)} />}
              {selectedDeposit.remarks && <div style={{ gridColumn: '1/-1' }}><DRow label="Remarks" value={selectedDeposit.remarks} /></div>}
            </div>
          )}
          {selectedDeposit?.document && (
            <button onClick={openDocumentInNewTab}
              style={{ marginTop: 16, width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ExternalLink style={{ width: 14, height: 14 }} /> View Proof of Payment
            </button>
          )}
        </div>
      </Modal>

      {/* ── Approve Modal ────────────────────────────────────────────────── */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth={440}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(16,185,129,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} />
              Approve Deposit
            </h3>
            <button onClick={() => setApproveOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          {selectedDeposit && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedDeposit.user.name} — ${selectedDeposit.amount.toLocaleString()}</p>}
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Bonus Amount ($)</label>
            <input type="number" min={0} value={bonus} onChange={e => setBonus(Number(e.target.value))}
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setApproveOpen(false)}
              style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleApprove} disabled={approveLoading}
              style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: approveLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle style={{ width: 14, height: 14 }} />
              Approve
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth={440}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(239,68,68,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle style={{ width: 18, height: 18, color: '#ef4444' }} />
              Reject Deposit
            </h3>
            <button onClick={() => setRejectOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          {selectedDeposit && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedDeposit.user.name} — ${selectedDeposit.amount.toLocaleString()}</p>}
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Rejection Reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} rows={4} placeholder="Provide a clear reason for rejection…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${rejectRemarks.trim() ? 'var(--theme-border)' : 'rgba(239,68,68,0.4)'}`, background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setRejectOpen(false)}
              style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleReject} disabled={rejectLoading || !rejectRemarks.trim()}
              style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (rejectLoading || !rejectRemarks.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <XCircle style={{ width: 14, height: 14 }} />
              Reject
            </button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </motion.div>
  )
}

export default DepositsPage
