// Frontend/src/pages/client/Partner/TradeCommission.tsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { RefreshCw, TrendingUp, BarChart2, DollarSign, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Users, Zap, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface TradeCommission { acNo: string; openTime: string; closeTime: string; openPrice: string; closePrice: string; symbol: string; profit: number; volume: number; rebate: number; status: string; level?: number }
interface IBPartner { _id: string; userId: { _id: string; firstname: string; lastname: string; email: string } | null; referralCode: string; level: number; totalVolume: number; totalEarned: number; totalTrades?: number }
interface CommissionTotals { totalProfit: number; totalVolume: number; totalRebate: number }
interface CommissionSummary { totalCommission: number; totalTrades: number; totalVolume: number; totalProfit: number; avgCommissionPerTrade: number; period: number }

const fmt = (v: number) => `$${v.toFixed(2)}`
const fmtDate = (s: string) => {
  if (!s || s === 'N/A') return '—'
  try {
    const d = new Date(s.includes(' ') ? s.replace(/\./g, '-').replace(' ', 'T') : s)
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return s }
}

const TradeCommission = () => {
  const [trades, setTrades] = useState<TradeCommission[]>([])
  const [partners, setPartners] = useState<IBPartner[]>([])
  const [totals, setTotals] = useState<CommissionTotals>({ totalProfit: 0, totalVolume: 0, totalRebate: 0 })
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null)
  const [partnerTrades, setPartnerTrades] = useState<{ [k: string]: TradeCommission[] }>({})
  const [loadingPartnerTrades, setLoadingPartnerTrades] = useState<{ [k: string]: boolean }>({})
  const [tradesPage, setTradesPage] = useState(1)
  const PER_PAGE = 10

  const fetchAll = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true); else setRefreshing(true)
    try {
      const token = localStorage.getItem('clientToken')
      if (!token) return
      const [tradesRes, partnersRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/ibclients/commission/trade-commissions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/ibclients/commission/partners`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/ibclients/commission/summary?period=30`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (tradesRes.data.success) { setTrades(tradesRes.data.trades); setTotals(tradesRes.data.totals) }
      if (partnersRes.data.success) setPartners(partnersRes.data.partners)
      if (summaryRes.data.success) setSummary(summaryRes.data.summary)
    } catch (err: any) {
      if (err?.response?.status === 404) toast.info("No IB configuration found.")
      else if (!isRefresh) toast.error("Failed to load commission data")
    } finally { setLoading(false); setRefreshing(false) }
  }

  const fetchPartnerTrades = async (partnerId: string) => {
    if (partnerTrades[partnerId]) return
    setLoadingPartnerTrades(p => ({ ...p, [partnerId]: true }))
    try {
      const token = localStorage.getItem('clientToken')
      if (!token) return
      const res = await axios.get(`${API_BASE_URL}/api/ibclients/commission/partner/${partnerId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) setPartnerTrades(p => ({ ...p, [partnerId]: res.data.trades }))
    } catch { toast.error("Failed to load partner trades") }
    finally { setLoadingPartnerTrades(p => ({ ...p, [partnerId]: false })) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleExpandPartner = async (id: string) => {
    setExpandedPartner(prev => prev === id ? null : id)
    if (expandedPartner !== id) await fetchPartnerTrades(id)
  }

  const paginatedTrades = trades.slice((tradesPage - 1) * PER_PAGE, tradesPage * PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(trades.length / PER_PAGE))

  const summaryItems = [
    { label: 'Total Rebate', value: fmt(totals.totalRebate), icon: DollarSign, color: '#10b981' },
    { label: 'Total Volume', value: totals.totalVolume.toFixed(2), icon: BarChart2, color: '#6366f1' },
    { label: 'Total Profit', value: fmt(totals.totalProfit), icon: TrendingUp, color: '#f59e0b' },
    { label: '30-Day Commission', value: fmt(summary?.totalCommission || 0), icon: Zap, color: '#ec4899' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading commissions…</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>IB Commission</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Track your trade commissions and partner earnings
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }}
          onClick={() => fetchAll(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryItems.map((s, idx) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
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
          </motion.div>
        ))}
      </div>

      {/* ── Partners Section ───────────────────────────────────────────── */}
      {partners.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Partner Commissions
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {partners.length}
            </span>
          </div>

          <div className="space-y-2">
            {partners.map((partner, idx) => (
              <motion.div key={partner._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.04 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                {/* Partner Row */}
                <button
                  onClick={() => handleExpandPartner(partner._id)}
                  className="w-full flex items-center gap-4 p-4 transition-all duration-200"
                  style={{}}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                    {partner.userId ? partner.userId.firstname.charAt(0) : '?'}
                  </div>
                  {/* Name & email */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                      {partner.userId ? `${partner.userId.firstname} ${partner.userId.lastname}` : 'Unknown'}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                      {partner.userId?.email || partner.referralCode}
                    </p>
                  </div>
                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>Volume</p>
                      <p className="text-xs font-bold font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                        {(partner.totalVolume || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>Earned</p>
                      <p className="text-xs font-bold font-mono text-emerald-500">
                        {fmt(partner.totalEarned || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>Level</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        L{partner.level}
                      </span>
                    </div>
                  </div>
                  {/* Expand icon */}
                  <div className="flex-shrink-0">
                    {loadingPartnerTrades[partner._id] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
                    ) : expandedPartner === partner._id ? (
                      <ChevronUp className="w-4 h-4" style={{ color: '#6366f1' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                    )}
                  </div>
                </button>

                {/* Expanded Trade Details */}
                <AnimatePresence>
                  {expandedPartner === partner._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ borderTop: '1px solid var(--theme-border)', overflow: 'hidden' }}>
                      {loadingPartnerTrades[partner._id] ? (
                        <div className="p-6 flex items-center gap-2 justify-center">
                          <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#6366f1' }} />
                          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Loading trades…</span>
                        </div>
                      ) : !partnerTrades[partner._id]?.length ? (
                        <div className="p-6 text-center">
                          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>No trades found for this partner.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                                {['Account', 'Symbol', 'Open Price', 'Close Price', 'Volume', 'Profit', 'Rebate', 'Status'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider"
                                    style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {partnerTrades[partner._id].slice(0, 10).map((t, i) => (
                                <tr key={i} className="transition-colors"
                                  style={{ borderTop: '1px solid var(--theme-border)' }}
                                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)')}
                                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                >
                                  <td className="px-3 py-2 text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>{t.acNo}</td>
                                  <td className="px-3 py-2">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{t.symbol}</span>
                                  </td>
                                  <td className="px-3 py-2 text-[10px] font-mono" style={{ color: 'var(--theme-text-primary)' }}>{t.openPrice}</td>
                                  <td className="px-3 py-2 text-[10px] font-mono" style={{ color: 'var(--theme-text-primary)' }}>{t.closePrice}</td>
                                  <td className="px-3 py-2 text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>{t.volume}</td>
                                  <td className="px-3 py-2 text-[10px] font-bold font-mono"
                                    style={{ color: t.profit >= 0 ? '#10b981' : '#ef4444' }}>
                                    {t.profit >= 0 ? '+' : ''}{fmt(t.profit)}
                                  </td>
                                  <td className="px-3 py-2 text-[10px] font-bold font-mono text-amber-400">
                                    {fmt(t.rebate)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                                      style={{
                                        background: t.status === 'closed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                        color: t.status === 'closed' ? '#10b981' : '#f59e0b',
                                      }}>{t.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── All Trade Commissions Table ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Commission History
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            {trades.length}
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          {trades.length === 0 ? (
            <div className="p-10 text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No trade commissions yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {['Account', 'Symbol', 'Open Price', 'Close Price', 'Volume', 'Profit', 'Rebate', 'Open Time', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedTrades.map((t, idx) => (
                        <motion.tr key={idx}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="transition-colors duration-150"
                          style={{ borderBottom: '1px solid var(--theme-border)' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{t.acNo}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{t.symbol}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-primary)' }}>{t.openPrice}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-primary)' }}>{t.closePrice}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{t.volume}</td>
                          <td className="px-4 py-3 text-xs font-bold font-mono"
                            style={{ color: t.profit >= 0 ? '#10b981' : '#ef4444' }}>
                            {t.profit >= 0 ? '+' : ''}{fmt(t.profit)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold font-mono text-amber-400">{fmt(t.rebate)}</td>
                          <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{fmtDate(t.openTime)}</td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                              style={{
                                background: t.status === 'closed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                color: t.status === 'closed' ? '#10b981' : '#f59e0b',
                              }}>{t.status}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {trades.length} trades · Page {tradesPage} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setTradesPage(p => Math.max(1, p - 1))} disabled={tradesPage === 1}
                      className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                    <button onClick={() => setTradesPage(p => Math.min(totalPages, p + 1))} disabled={tradesPage === totalPages}
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

export default TradeCommission
