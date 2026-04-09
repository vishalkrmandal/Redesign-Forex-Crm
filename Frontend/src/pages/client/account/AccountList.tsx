// Frontend/src/pages/client/account/AccountList.tsx
import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Lock, EyeOff, Eye, Copy, Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import axios, { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Account {
  _id: string; mt5Account: string; user: string; accountType: string;
  platform: string; balance: number; equity: number; status: boolean;
  leverage: string; name: string; investor_pwd: string; master_pwd: string;
  groupName: string; managerIndex: string; createdAt: string; updatedAt: string;
}
interface SummaryData { totalBalance: number; totalEquity: number; totalPL: number }

const ACCOUNTS_PER_PAGE = 10
const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)

// Password validation
const validatePassword = (pwd: string): string[] => {
  const errs: string[] = []
  if (pwd.length < 8) errs.push('At least 8 characters')
  if (!/[A-Z]/.test(pwd)) errs.push('At least one uppercase letter')
  if (!/[a-z]/.test(pwd)) errs.push('At least one lowercase letter')
  if (!/[0-9]/.test(pwd)) errs.push('At least one number')
  return errs
}

export default function AccountList() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [summary, setSummary] = useState<SummaryData>({ totalBalance: 0, totalEquity: 0, totalPL: 0 })

  // Password dialog
  const [pwDialog, setPwDialog] = useState({ isOpen: false, accountId: '', accountNumber: '', leverage: '', investor_pwd: '', master_pwd: '', newInvPwd: '', confirmInvPwd: '', newMasterPwd: '', confirmMasterPwd: '', changingInv: false, changingMaster: false, showNewInv: false, showConfInv: false, showNewMaster: false, showConfMaster: false, invErrors: [] as string[], masterErrors: [] as string[] })

  const triggerBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const user = JSON.parse(localStorage.getItem('clientUser') || '{}')
      if (!token || !user.id) return
      await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/users/${user.id}/accounts`, { headers: { Authorization: `Bearer ${token}` } })
    } catch { /* silent */ }
  }

  const fetchAccounts = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const token = localStorage.getItem("clientToken")
      const res = await axios.get(`${API_BASE_URL}/api/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success && Array.isArray(res.data.data)) {
        const data: Account[] = res.data.data
        setAccounts(data)
        const totalBalance = data.reduce((s, a) => s + (a.balance || 0), 0)
        const totalEquity = data.reduce((s, a) => s + (a.equity || 0), 0)
        setSummary({ totalBalance, totalEquity, totalPL: totalEquity - totalBalance })
      }
    } catch { setError("Failed to load accounts") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { triggerBalanceUpdate(); fetchAccounts() }, [fetchAccounts])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const openPasswordDialog = (account: Account) => {
    setPwDialog(p => ({ ...p, isOpen: true, accountId: account._id, accountNumber: account.mt5Account, leverage: account.leverage, investor_pwd: account.investor_pwd, master_pwd: account.master_pwd, newInvPwd: '', confirmInvPwd: '', newMasterPwd: '', confirmMasterPwd: '', changingInv: false, changingMaster: false, invErrors: [], masterErrors: [] }))
  }
  const closePwDialog = () => setPwDialog(p => ({ ...p, isOpen: false }))

  const handlePasswordChange = async (type: 'investor' | 'master') => {
    const newPwd = type === 'investor' ? pwDialog.newInvPwd : pwDialog.newMasterPwd
    const confirmPwd = type === 'investor' ? pwDialog.confirmInvPwd : pwDialog.confirmMasterPwd
    const errors = validatePassword(newPwd)
    if (errors.length) {
      setPwDialog(p => ({ ...p, [type === 'investor' ? 'invErrors' : 'masterErrors']: errors }))
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords don't match"); return
    }
    setPwDialog(p => ({ ...p, [type === 'investor' ? 'changingInv' : 'changingMaster']: true }))
    try {
      const token = localStorage.getItem('clientToken')
      await axios.post(`${API_BASE_URL}/api/accounts/${pwDialog.accountId}/change-password`, { type, newPassword: newPwd }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(`${type === 'investor' ? 'Investor' : 'Master'} password updated!`)
      closePwDialog(); fetchAccounts()
    } catch (err) {
      const msg = (err as AxiosError<any>)?.response?.data?.message || 'Failed to change password'
      toast.error(msg)
    } finally {
      setPwDialog(p => ({ ...p, [type === 'investor' ? 'changingInv' : 'changingMaster']: false }))
    }
  }

  const totalPages = Math.ceil(accounts.length / ACCOUNTS_PER_PAGE)
  const paginated = accounts.slice((currentPage - 1) * ACCOUNTS_PER_PAGE, currentPage * ACCOUNTS_PER_PAGE)

  return (
    <div className="space-y-5 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
            Trading Accounts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={fetchAccounts} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/client/account/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            <Plus className="w-4 h-4" />
            New Account
          </motion.button>
        </div>
      </motion.div>

      {/* ── Summary Strip ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Balance', val: fmt(summary.totalBalance), icon: Wallet, color: '#6366f1' },
          { label: 'Total Equity', val: fmt(summary.totalEquity), icon: TrendingUp, color: '#10b981' },
          { label: summary.totalPL >= 0 ? 'Unrealized Gain' : 'Unrealized Loss', val: (summary.totalPL >= 0 ? '+' : '') + fmt(summary.totalPL), icon: summary.totalPL >= 0 ? TrendingUp : TrendingDown, color: summary.totalPL >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${s.color}18` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium truncate" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: s.color }}>{s.val}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading accounts…</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={fetchAccounts} className="mt-3 px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: '#6366f1' }}>Retry</button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--theme-text-primary)' }}>No trading accounts</p>
            <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>Create your first trading account to get started.</p>
            <button onClick={() => navigate('/client/account/new')} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>Open Account</button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {['Account', 'Type', 'Platform', 'Balance', 'Equity', 'Leverage', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginated.map((acc, idx) => {
                      const pl = (acc.equity || 0) - (acc.balance || 0)
                      return (
                        <motion.tr key={acc._id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: '1px solid var(--theme-border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                {String(acc.mt5Account).slice(-2)}
                              </div>
                              <div>
                                <div className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                                  {acc.mt5Account}
                                </div>
                                <button onClick={() => copyToClipboard(acc.mt5Account, 'Account')}
                                  className="flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity"
                                  style={{ color: '#6366f1' }}>
                                  <Copy className="w-2.5 h-2.5" /> Copy
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                              {acc.accountType || acc.groupName || 'Standard'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>{acc.platform || '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                            {fmt(acc.balance || 0)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-bold font-mono" style={{ color: 'var(--theme-text-primary)' }}>{fmt(acc.equity || 0)}</div>
                            {pl !== 0 && (
                              <div className="text-[10px] font-semibold" style={{ color: pl >= 0 ? '#10b981' : '#ef4444' }}>
                                {pl >= 0 ? '+' : ''}{fmt(pl)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                            1:{acc.leverage || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold w-fit px-2 py-0.5 rounded-full"
                              style={{
                                background: acc.status ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: acc.status ? '#10b981' : '#ef4444',
                              }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: acc.status ? '#10b981' : '#ef4444' }} />
                              {acc.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openPasswordDialog(acc)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 hover:opacity-80"
                              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                              <Lock className="w-3 h-3" /> Passwords
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {paginated.map((acc, idx) => {
                const pl = (acc.equity || 0) - (acc.balance || 0)
                return (
                  <motion.div key={acc._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                    className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                          {String(acc.mt5Account).slice(-2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>{acc.mt5Account}</div>
                          <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{acc.accountType || 'Standard'}</div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: acc.status ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: acc.status ? '#10b981' : '#ef4444' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: acc.status ? '#10b981' : '#ef4444' }} />
                        {acc.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Balance', val: fmt(acc.balance || 0) },
                        { label: 'Equity', val: fmt(acc.equity || 0) },
                        { label: 'P&L', val: (pl >= 0 ? '+' : '') + fmt(pl), color: pl >= 0 ? '#10b981' : '#ef4444' },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-2" style={{ background: 'var(--theme-border)' }}>
                          <p className="text-[9px] mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
                          <p className="text-[11px] font-bold font-mono" style={{ color: s.color || 'var(--theme-text-primary)' }}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyToClipboard(acc.mt5Account, 'Account')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium"
                        style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                        <Copy className="w-3 h-3" /> Copy ID
                      </button>
                      <button onClick={() => openPasswordDialog(acc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                        <Lock className="w-3 h-3" /> Passwords
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid var(--theme-border)' }}>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                  </button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Password Dialog Portal ──────────────────────────────────────── */}
      {pwDialog.isOpen && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) closePwDialog() }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>Account Passwords</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>#{pwDialog.accountNumber}</p>
                </div>
                <button onClick={closePwDialog} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ background: 'var(--theme-border)' }}>
                  <X className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                </button>
              </div>

              {[
                { type: 'investor' as const, label: 'Investor Password', current: pwDialog.investor_pwd, newVal: pwDialog.newInvPwd, confirm: pwDialog.confirmInvPwd, showNew: pwDialog.showNewInv, showConf: pwDialog.showConfInv, errors: pwDialog.invErrors, changing: pwDialog.changingInv, onNewChange: (v: string) => setPwDialog(p => ({ ...p, newInvPwd: v, invErrors: [] })), onConfChange: (v: string) => setPwDialog(p => ({ ...p, confirmInvPwd: v })), onToggleNew: () => setPwDialog(p => ({ ...p, showNewInv: !p.showNewInv })), onToggleConf: () => setPwDialog(p => ({ ...p, showConfInv: !p.showConfInv })) },
                { type: 'master' as const, label: 'Master Password', current: pwDialog.master_pwd, newVal: pwDialog.newMasterPwd, confirm: pwDialog.confirmMasterPwd, showNew: pwDialog.showNewMaster, showConf: pwDialog.showConfMaster, errors: pwDialog.masterErrors, changing: pwDialog.changingMaster, onNewChange: (v: string) => setPwDialog(p => ({ ...p, newMasterPwd: v, masterErrors: [] })), onConfChange: (v: string) => setPwDialog(p => ({ ...p, confirmMasterPwd: v })), onToggleNew: () => setPwDialog(p => ({ ...p, showNewMaster: !p.showNewMaster })), onToggleConf: () => setPwDialog(p => ({ ...p, showConfMaster: !p.showConfMaster })) },
              ].map(field => (
                <div key={field.type} className="mb-5 p-4 rounded-xl"
                  style={{ background: 'var(--theme-border)', border: '1px solid var(--theme-border)' }}>
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                    {field.label}
                  </p>
                  {/* Current password display */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
                      style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}>
                      {field.current || '••••••••'}
                    </div>
                    <button onClick={() => copyToClipboard(field.current, field.label)} className="p-2 rounded-lg"
                      style={{ background: 'var(--theme-bg-card)' }}>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </div>
                  {/* New password */}
                  <div className="relative mb-2">
                    <input type={field.showNew ? 'text' : 'password'} placeholder={`New ${field.label}`}
                      value={field.newVal} onChange={e => field.onNewChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs pr-8 outline-none"
                      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }} />
                    <button onClick={field.onToggleNew} className="absolute right-2 top-1/2 -translate-y-1/2">
                      {field.showNew ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} /> : <Eye className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />}
                    </button>
                  </div>
                  {/* Confirm password */}
                  <div className="relative mb-2">
                    <input type={field.showConf ? 'text' : 'password'} placeholder="Confirm password"
                      value={field.confirm} onChange={e => field.onConfChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs pr-8 outline-none"
                      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }} />
                    <button onClick={field.onToggleConf} className="absolute right-2 top-1/2 -translate-y-1/2">
                      {field.showConf ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} /> : <Eye className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />}
                    </button>
                  </div>
                  {field.errors.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {field.errors.map(e => <li key={e} className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />{e}</li>)}
                    </ul>
                  )}
                  <button onClick={() => handlePasswordChange(field.type)} disabled={!field.newVal || field.changing}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: '#6366f1', color: 'white' }}>
                    {field.changing ? 'Updating…' : `Update ${field.label}`}
                  </button>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
