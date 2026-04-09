// Frontend/src/pages/client/Partner/IBWithdrawal.tsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { DollarSign, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, X, Banknote, Building2, ChevronLeft, ChevronRight, RefreshCw, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as React from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface ProfileDetails { user: { firstname: string; lastname: string; email: string }; bankDetails: { bankName?: string; accountHolderName?: string; accountNumber?: string; ifscSwiftCode?: string }; walletDetails: { tetherWalletAddress?: string; ethWalletAddress?: string; trxWalletAddress?: string }; availableBalance: number }
interface WithdrawalRequest { _id: string; amount: number; withdrawalMethod: string; status: string; bankDetails?: any; walletDetails?: any; rejectedReason?: string; createdAt: string; processedAt?: string }

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
const fmtDate = (s: string) => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const statusStyle = (s: string) => ({
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: Clock },
  approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', icon: CheckCircle },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: X },
}[s] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', icon: AlertCircle })

const IBWithdrawal = () => {
  const [profile, setProfile] = useState<ProfileDetails | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountHolderName: '', accountNumber: '', ifscSwiftCode: '' })
  const [walletDetails, setWalletDetails] = useState({ walletType: '', walletAddress: '' })
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('clientToken')
      if (!token) { toast.error('Not authenticated'); return }
      const [profRes, histRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/ibclients/withdrawals/profile-details`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/ibclients/withdrawals/history`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (profRes.data.success) setProfile(profRes.data.profile)
      if (histRes.data.success) setWithdrawals(histRes.data.withdrawals)
    } catch (e: any) {
      toast.info(e?.response?.data?.message || 'Failed to load data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (profile && method === 'bank') {
      setBankDetails({ bankName: profile.bankDetails.bankName || '', accountHolderName: profile.bankDetails.accountHolderName || '', accountNumber: profile.bankDetails.accountNumber || '', ifscSwiftCode: profile.bankDetails.ifscSwiftCode || '' })
    }
  }, [profile, method])

  const getWalletAddress = (type: string) => {
    if (!profile) return ''
    return { tether: profile.walletDetails.tetherWalletAddress, eth: profile.walletDetails.ethWalletAddress, trx: profile.walletDetails.trxWalletAddress }[type] || ''
  }

  const handleWalletTypeChange = (type: string) => {
    setWalletDetails({ walletType: type, walletAddress: getWalletAddress(type) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amtNum = parseFloat(amount)
    if (!amtNum || amtNum <= 0) { toast.error('Enter a valid amount'); return }
    if (!method) { toast.error('Select a withdrawal method'); return }
    if (amtNum > (profile?.availableBalance || 0)) { toast.error('Insufficient balance'); return }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('clientToken')
      const body = { amount: amtNum, withdrawalMethod: method, ...(method === 'bank' ? { bankDetails } : { walletDetails }) }
      const res = await axios.post(`${API_BASE_URL}/api/ibclients/withdrawals/request`, body, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) { toast.success('Withdrawal request submitted!'); setAmount(''); setMethod(''); fetchData() }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const cancelWithdrawal = async (id: string) => {
    try {
      const token = localStorage.getItem('clientToken')
      const res = await axios.delete(`${API_BASE_URL}/api/ibclients/withdrawals/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) { toast.success('Request cancelled'); fetchData() }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to cancel') }
  }

  const paginatedWithdrawals = withdrawals.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(withdrawals.length / PER_PAGE))
  const availableBalance = profile?.availableBalance || 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading…</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>IB Withdrawal</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Withdraw your commission earnings
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </motion.button>
      </motion.div>

      {/* ── Balance Banner ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="relative overflow-hidden rounded-2xl p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 translate-x-12 -translate-y-12"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="relative z-10">
          <p className="text-xs font-medium mb-1" style={{ color: 'rgba(16,185,129,0.8)' }}>Available to Withdraw</p>
          <p className="text-3xl font-black font-mono" style={{ color: '#10b981' }}>
            {fmt(availableBalance)}
          </p>
          {profile?.user && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {profile.user.firstname} {profile.user.lastname}
            </p>
          )}
        </div>
        <div className="relative z-10 p-3 rounded-2xl" style={{ background: 'rgba(16,185,129,0.2)' }}>
          <Wallet className="w-7 h-7 text-emerald-400" />
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Withdrawal Form ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>New Withdrawal</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type="number" min="1" step="0.01" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-mono outline-none"
                  style={{ background: 'var(--theme-border)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                />
              </div>
              {parseFloat(amount) > availableBalance && (
                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Exceeds available balance
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} type="button"
                    onClick={() => setAmount((availableBalance * pct / 100).toFixed(2))}
                    className="flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Withdrawal Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'bank', label: 'Bank Transfer', icon: Building2, color: '#6366f1' },
                  { value: 'crypto', label: 'Crypto Wallet', icon: Wallet, color: '#f59e0b' },
                ].map(m => (
                  <motion.button key={m.value} type="button" whileTap={{ scale: 0.96 }}
                    onClick={() => setMethod(m.value)}
                    className="flex items-center gap-2 p-3 rounded-xl transition-all text-left"
                    style={{
                      background: method === m.value ? `${m.color}15` : 'var(--theme-border)',
                      border: method === m.value ? `1px solid ${m.color}40` : '1px solid transparent',
                    }}>
                    <m.icon className="w-4 h-4 flex-shrink-0" style={{ color: method === m.value ? m.color : 'var(--theme-text-muted)' }} />
                    <span className="text-xs font-semibold" style={{ color: method === m.value ? m.color : 'var(--theme-text-muted)' }}>
                      {m.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <AnimatePresence>
              {method === 'bank' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  {[
                    { key: 'bankName', label: 'Bank Name', icon: Building2 },
                    { key: 'accountHolderName', label: 'Account Holder', icon: CreditCard },
                    { key: 'accountNumber', label: 'Account Number', icon: Banknote },
                    { key: 'ifscSwiftCode', label: 'IFSC / SWIFT', icon: DollarSign },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--theme-text-muted)' }}>
                        {f.label}
                      </label>
                      <div className="relative">
                        <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                        <input type="text" value={(bankDetails as any)[f.key]}
                          onChange={e => setBankDetails(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                          style={{ background: 'var(--theme-border)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Crypto Details */}
            <AnimatePresence>
              {method === 'crypto' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                      Wallet Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'tether', label: 'USDT (TRC20)', color: '#10b981' },
                        { value: 'eth', label: 'ETH', color: '#6366f1' },
                        { value: 'trx', label: 'TRX', color: '#f59e0b' },
                      ].map(w => (
                        <button key={w.value} type="button"
                          onClick={() => handleWalletTypeChange(w.value)}
                          className="py-2 rounded-xl text-[10px] font-semibold transition-all"
                          style={{
                            background: walletDetails.walletType === w.value ? `${w.color}15` : 'var(--theme-border)',
                            border: walletDetails.walletType === w.value ? `1px solid ${w.color}40` : '1px solid transparent',
                            color: walletDetails.walletType === w.value ? w.color : 'var(--theme-text-muted)',
                          }}>{w.label}</button>
                      ))}
                    </div>
                  </div>
                  {walletDetails.walletType && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--theme-text-muted)' }}>
                        Wallet Address
                      </label>
                      <input type="text" value={walletDetails.walletAddress} readOnly
                        className="w-full px-3 py-2 rounded-xl text-xs font-mono outline-none"
                        style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                        placeholder="No wallet address saved" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={submitting || !amount || !method || parseFloat(amount) > availableBalance}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              {submitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                <><ArrowUpRight className="w-4 h-4" /> Submit Withdrawal</>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* ── Withdrawal History ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
            <Banknote className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Withdrawal History</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              {withdrawals.length}
            </span>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-10 text-center">
              <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No withdrawal history.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {['Amount', 'Method', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedWithdrawals.map((w, idx) => {
                        const st = statusStyle(w.status)
                        const StatusIcon = st.icon
                        return (
                          <motion.tr key={w._id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="transition-colors duration-150"
                            style={{ borderBottom: '1px solid var(--theme-border)' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.03)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            <td className="px-4 py-3 text-sm font-bold font-mono text-emerald-500">
                              {fmt(w.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-[10px] font-semibold capitalize"
                                style={{ color: 'var(--theme-text-muted)' }}>
                                {w.withdrawalMethod === 'bank' ? <Building2 className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                                {w.withdrawalMethod}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 w-fit text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: st.bg, color: st.color }}>
                                <StatusIcon className="w-3 h-3" />
                                {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                              </span>
                              {w.rejectedReason && (
                                <p className="text-[9px] mt-0.5 text-red-400">{w.rejectedReason}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                              {fmtDate(w.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {w.status === 'pending' && (
                                <motion.button whileTap={{ scale: 0.93 }}
                                  onClick={() => cancelWithdrawal(w._id)}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
                                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                                  <X className="w-3 h-3" /> Cancel
                                </motion.button>
                              )}
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default IBWithdrawal
