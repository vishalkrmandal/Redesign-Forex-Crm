// Frontend/src/pages/client/Partner/PartnerDashboard.tsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RefreshCw, TrendingUp, Wallet, Users, ArrowUpRight, CheckCircle, Clock, XCircle, Eye, ChevronLeft, ChevronRight, Banknote, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface IBPartner { _id: string; userId: { _id: string; firstname: string; lastname: string; email: string } | null; referralCode: string; level: number; totalVolume: number; totalEarned: number; totalBalance: number; totalEquity: number }
interface IBSummary { totalCommission: number; withdrawableBalance: number; totalWithdrawals: number; partnersCount: number }
interface WithdrawalRequest { _id: string; amount: number; withdrawalMethod: string; status: string; createdAt: string; rejectedReason?: string }

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const statusStyle = (s: string) => ({
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: Clock },
  approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', icon: CheckCircle },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: XCircle },
}[s] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', icon: Eye })

const PartnerDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [ibSummary, setIbSummary] = useState<IBSummary>({ totalCommission: 0, withdrawableBalance: 0, totalWithdrawals: 0, partnersCount: 0 })
  const [partnersList, setPartnersList] = useState<IBPartner[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([])
  const [partnersPage, setPartnersPage] = useState(1)
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const PER_PAGE = 8

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true); else setRefreshing(true)
    try {
      const token = localStorage.getItem('clientToken')
      if (!token) { toast.error('Not authenticated'); return }

      const [dashRes, partnersRes, withdrawalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/ibclients/ib-configurations/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/ibclients/ib-configurations/partners`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/ibclients/withdrawals/history`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (dashRes.data.success) setIbSummary(dashRes.data.summary)
      if (partnersRes.data.success) setPartnersList(partnersRes.data.partners)
      if (withdrawalsRes.data.success) setWithdrawalHistory(withdrawalsRes.data.withdrawals)
    } catch {
      if (!isRefresh) toast.error('Failed to load dashboard data')
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchData() }, [])

  const paginatedPartners = partnersList.slice((partnersPage - 1) * PER_PAGE, partnersPage * PER_PAGE)
  const paginatedWithdrawals = withdrawalHistory.slice((withdrawalsPage - 1) * PER_PAGE, withdrawalsPage * PER_PAGE)
  const partnersTotalPages = Math.max(1, Math.ceil(partnersList.length / PER_PAGE))
  const withdrawalsTotalPages = Math.max(1, Math.ceil(withdrawalHistory.length / PER_PAGE))

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading dashboard…</p>
      </div>
    </div>
  )

  const summaryItems = [
    { label: 'Total Commission', value: fmt(ibSummary.totalCommission), icon: TrendingUp, color: '#10b981', sub: 'Lifetime earnings' },
    { label: 'Available Balance', value: fmt(ibSummary.withdrawableBalance), icon: Wallet, color: '#6366f1', sub: 'Ready to withdraw' },
    { label: 'Total Withdrawn', value: fmt(ibSummary.totalWithdrawals), icon: Banknote, color: '#f59e0b', sub: 'Paid out' },
    { label: 'Network Partners', value: ibSummary.partnersCount.toString(), icon: Users, color: '#ec4899', sub: 'Active referrals' },
  ]

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>Partner Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Your IB network performance and earnings overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => { fetchData(true); toast.success('Refreshed') }} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/client/partner/ib-withdrawal')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryItems.map((s, idx) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
              <div className="p-1.5 rounded-lg" style={{ background: `${s.color}18` }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-xl font-black font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-disabled)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'View IB Commission', path: '/client/partner/commission', color: '#10b981' },
          { label: 'Withdraw Earnings', path: '/client/partner/ib-withdrawal', color: '#6366f1' },
          { label: 'Create IB Account', path: '/client/partner/create', color: '#f59e0b' },
        ].map(a => (
          <motion.button key={a.label} whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }}
            onClick={() => navigate(a.path)}
            className="flex items-center justify-between p-3 rounded-xl transition-all"
            style={{ background: `${a.color}10`, border: `1px solid ${a.color}25` }}>
            <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: a.color }} />
          </motion.button>
        ))}
      </div>

      {/* ── Partner Details Table ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Network Partners
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {partnersList.length}
            </span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          {partnersList.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No partners yet. Share your referral link to grow your network.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {['Partner', 'Referral Code', 'Level', 'Volume', 'Earned', 'Balance'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedPartners.map((partner, idx) => (
                        <motion.tr key={partner._id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="transition-colors duration-150"
                          style={{ borderBottom: '1px solid var(--theme-border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            {partner.userId ? (
                              <div>
                                <div className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                                  {partner.userId.firstname} {partner.userId.lastname}
                                </div>
                                <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                                  {partner.userId.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                              {partner.referralCode}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                              L{partner.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                            {(partner.totalVolume || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold font-mono text-emerald-500">
                            {fmt(partner.totalEarned || 0)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                            {fmt(partner.totalBalance || 0)}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {partnersTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Page {partnersPage} of {partnersTotalPages}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setPartnersPage(p => Math.max(1, p - 1))} disabled={partnersPage === 1}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                    <button onClick={() => setPartnersPage(p => Math.min(partnersTotalPages, p + 1))} disabled={partnersPage === partnersTotalPages}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── Withdrawal History Table ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Withdrawal History
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              {withdrawalHistory.length}
            </span>
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/client/partner/ib-withdrawal')}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: '#6366f1' }}>
            New Withdrawal <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          {withdrawalHistory.length === 0 ? (
            <div className="p-10 text-center">
              <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No withdrawal history yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {['Amount', 'Method', 'Status', 'Date', 'Reason'].map(h => (
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
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.03)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="px-4 py-3 text-sm font-bold font-mono text-emerald-500">
                              {fmt(w.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                                {w.withdrawalMethod}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 w-fit text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: st.bg, color: st.color }}>
                                <StatusIcon className="w-3 h-3" />
                                {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                              {fmtDate(w.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-[10px]" style={{ color: '#ef4444' }}>
                              {w.rejectedReason || '—'}
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {withdrawalsTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    Page {withdrawalsPage} of {withdrawalsTotalPages}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))} disabled={withdrawalsPage === 1}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                    <button onClick={() => setWithdrawalsPage(p => Math.min(withdrawalsTotalPages, p + 1))} disabled={withdrawalsPage === withdrawalsTotalPages}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default PartnerDashboard
