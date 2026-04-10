// Frontend/src/pages/client/financial/TransactionHistory.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Download, Filter, Search, X, Calendar, TrendingUp, TrendingDown,
  ArrowLeftRight, RefreshCw, FileText, ChevronLeft, ChevronRight,
  BarChart3, DollarSign
} from "lucide-react"
import axios from "axios"
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Transaction {
  _id: string
  account: string
  type: string
  description: string
  amount: string
  date: string
  status: string
  formattedDate?: string
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: string }) => {
  const cfg: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    Deposit:    { bg: '#10b98120', text: '#10b981', icon: TrendingUp },
    Withdrawal: { bg: '#ef444420', text: '#ef4444', icon: TrendingDown },
    Transfer:   { bg: '#6366f120', text: '#6366f1', icon: ArrowLeftRight },
  }
  const c = cfg[type] || { bg: '#94a3b820', text: '#94a3b8', icon: DollarSign }
  const Icon = c.icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    Completed: { bg: '#10b98120', text: '#10b981' },
    Approved:  { bg: '#10b98120', text: '#10b981' },
    Pending:   { bg: '#f59e0b20', text: '#f59e0b' },
    Rejected:  { bg: '#ef444420', text: '#ef4444' },
  }
  const c = cfg[status] || { bg: '#94a3b820', text: '#94a3b8' }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>{status}</span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5,6].map(i => (
      <td key={i} className="px-5 py-3.5">
        <div className="h-4 rounded-lg animate-pulse" style={{ background: 'var(--theme-border)', width: `${50 + (i * 15) % 40}%` }} />
      </td>
    ))}
  </tr>
)

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [transactionType, setTransactionType] = useState("all")
  const [status, setStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem("clientToken")
      if (!token) { setError("Authentication required"); setLoading(false); return }

      const params = new URLSearchParams()
      if (transactionType !== "all") params.append("type", transactionType)
      if (status !== "all") params.append("status", status)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (search) params.append("search", search)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await axios.get(`${API_BASE_URL}/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setTransactions(response.data.data)
        setTotalPages(response.data.pagination.pages)
        setTotalCount(response.data.count)
      } else {
        setError("Failed to fetch transactions")
      }
    } catch {
      setError("Error fetching transaction history. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [transactionType, status, currentPage, itemsPerPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTransactions()
  }

  const applyFilters = () => { setCurrentPage(1); fetchTransactions(); setShowFilters(false) }
  const resetFilters = () => {
    setStatus("all"); setStartDate(""); setEndDate(""); setCurrentPage(1); setShowFilters(false)
  }

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (transactionType !== "all") params.append("type", transactionType)
      if (status !== "all") params.append("status", status)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (search) params.append("search", search)
      const token = localStorage.getItem("clientToken")
      const response = await axios.get(`${API_BASE_URL}/api/transactions/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Transactions')
        worksheet.addRow(["Account", "Type", "Description", "Amount", "Date & Time", "Status"])
        response.data.data.forEach((t: Transaction) => {
          worksheet.addRow([t.account, t.type, t.description, t.amount, t.formattedDate, t.status])
        })
        worksheet.getRow(1).font = { bold: true }
        worksheet.columns.forEach(col => {
          let max = 10
          if (typeof col.eachCell === "function") {
            col.eachCell({ includeEmpty: true }, cell => {
              max = Math.max(max, (cell.value?.toString() || '').length)
            })
          }
          col.width = max + 2
        })
        const dateStr = new Date().toISOString().split('T')[0]
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `transactions_${dateStr}.xlsx`
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
      }
    } catch { setError("Failed to export to Excel.") }
  }

  const exportToPDF = async () => {
    try {
      const params = new URLSearchParams()
      if (transactionType !== "all") params.append("type", transactionType)
      if (status !== "all") params.append("status", status)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (search) params.append("search", search)
      const token = localStorage.getItem("clientToken")
      const response = await axios.get(`${API_BASE_URL}/api/transactions/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        const doc = new jsPDF({ orientation: 'landscape' })
        const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')

        // Title
        doc.setFontSize(18)
        doc.setTextColor(40, 40, 40)
        doc.text('Transaction History', 14, 18)
        doc.setFontSize(10)
        doc.setTextColor(120, 120, 120)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

        // Table using autoTable plugin
        autoTable(doc, {
          startY: 34,
          head: [['#', 'Account', 'Type', 'Description', 'Amount', 'Date & Time', 'Status']],
          body: response.data.data.map((t: Transaction, idx: number) => [
            idx + 1,
            t.account || '',
            t.type || '',
            t.description || '',
            t.amount || '',
            t.formattedDate || (t.date ? new Date(t.date).toLocaleString() : ''),
            t.status || '',
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 10 },
            3: { cellWidth: 60 },
            5: { cellWidth: 40 },
          },
        })

        doc.save(`transactions_${dateStr}.pdf`)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      setError("Failed to export to PDF.")
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  // Summary counts
  const summaryCounts = transactions.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Transaction History</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            View and filter all your account transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentPage(1); fetchTransactions() }}
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* ── Summary Pills ─────────────────────────────────────────────────── */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)', color: 'var(--theme-primary)' }}>
            {totalCount} total
          </div>
          {Object.entries(summaryCounts).map(([type, count]) => {
            const colors: Record<string, string> = { Deposit: '#10b981', Withdrawal: '#ef4444', Transfer: '#6366f1' }
            const c = colors[type] || '#94a3b8'
            return (
              <div key={type} className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: `${c}15`, color: c }}>
                {count} {type}{count !== 1 ? 's' : ''}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Search, Filter & Export Bar ───────────────────────────────────── */}
      <div className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />
            <input
              type="text"
              placeholder="Search transactions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
            />
          </form>

          {/* Type Filter */}
          <select
            value={transactionType}
            onChange={e => { setTransactionType(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="transfer">Transfers</option>
          </select>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: showFilters ? 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' : 'var(--theme-bg-main)',
              border: `1px solid ${showFilters ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
              color: showFilters ? 'var(--theme-primary)' : 'var(--theme-text-muted)'
            }}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-20"
                  style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                >
                  <button
                    onClick={() => { exportToExcel(); setShowExportMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors hover:opacity-70"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    <BarChart3 className="w-4 h-4 text-green-500" />Excel (.xlsx)
                  </button>
                  <div style={{ height: '1px', background: 'var(--theme-border)' }} />
                  <button
                    onClick={() => { exportToPDF(); setShowExportMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors hover:opacity-70"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    <FileText className="w-4 h-4 text-red-500" />PDF (.pdf)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Advanced Filters Panel ─────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Status */}
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>From Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--theme-text-muted)' }} />
                      <input
                        type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>To Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--theme-text-muted)' }} />
                      <input
                        type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-70"
                    style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
                    style={{ background: 'var(--theme-primary)' }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-xl p-3"
            style={{ background: '#ef444415', border: '1px solid #ef444440' }}>
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ── Desktop Table ─────────────────────────────────────────────── */}
        <div className="mt-5 hidden md:block">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--theme-bg-main)', borderBottom: '1px solid var(--theme-border)' }}>
                  {['Account', 'Type', 'Description', 'Amount', 'Date & Time', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : transactions.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-10 h-10 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>No transactions found</p>
                            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    )
                    : transactions.map((tx, idx) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--theme-border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-bg-main)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                          {tx.account}
                        </td>
                        <td className="px-5 py-3.5">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="px-5 py-3.5 text-sm max-w-xs">
                          <div className="truncate" title={tx.description} style={{ color: 'var(--theme-text-muted)' }}>
                            {tx.description}
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 text-sm font-semibold ${tx.amount.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                          {tx.amount}
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={tx.status} />
                        </td>
                      </motion.tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile Cards ──────────────────────────────────────────────── */}
        <div className="mt-4 md:hidden space-y-3">
          {loading
            ? [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse space-y-2"
                style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                <div className="h-4 w-1/2 rounded-lg" style={{ background: 'var(--theme-border)' }} />
                <div className="h-3 w-3/4 rounded-lg" style={{ background: 'var(--theme-border)' }} />
              </div>
            ))
            : transactions.length === 0
              ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No transactions found</p>
                </div>
              )
              : transactions.map((tx, idx) => (
                <motion.div
                  key={tx._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TypeBadge type={tx.type} />
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Amount</span>
                      <span className={`text-sm font-bold ${tx.amount.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {tx.amount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Account</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>{tx.account}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Description</span>
                      <span className="text-xs text-right max-w-[60%]" style={{ color: 'var(--theme-text-primary)' }}>{tx.description}</span>
                    </div>
                    <div className="pt-1.5" style={{ borderTop: '1px solid var(--theme-border)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
          }
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-5"
            style={{ borderTop: '1px solid var(--theme-border)' }}>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Showing{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}
              </span>{' '}–{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{totalCount}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>Rows:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1) }}
                >
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) page = i + 1
                  else if (currentPage <= 3) page = i + 1
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                  else page = currentPage - 2 + i
                  if (page < 1 || page > totalPages) return null
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: page === currentPage ? 'var(--theme-primary)' : 'var(--theme-bg-main)',
                        border: `1px solid ${page === currentPage ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                        color: page === currentPage ? 'white' : 'var(--theme-text-muted)'
                      }}
                    >{page}</button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
