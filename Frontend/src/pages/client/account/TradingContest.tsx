// Frontend/src/pages/client/account/TradingContest.tsx
import { useState, useEffect, useCallback } from "react"
import { Search, RefreshCw, TrendingUp, TrendingDown, Activity, ChevronLeft, ChevronRight, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Trade = {
  ticket: string; account: string; accountName: string; accountType: string;
  symbol: string; trade: string; tradeType: string; openTime: string; openPrice: string;
  currentPrice?: string; closeTime?: string; closePrice?: string; volume: string;
  profit: string; profitFormatted: string; status: "open" | "closed";
  commission: number; swap: number; stopLoss: number; takeProfit: number; comment: string;
}
type OpenTradesResponse = { trades: Trade[]; total: number; totalProfit: number; totalProfitFormatted: string; accounts: any[] }
type ClosedTradesResponse = { trades: Trade[]; total: number; totalProfit: number; totalProfitFormatted: string; profitableTrades: number; losingTrades: number; winRate: number; accounts: any[] }

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const fmtPrice = (v: string | number | undefined) => {
  if (!v) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  return isNaN(n) ? String(v) : n.toFixed(5)
}

const fmtProfit = (v: string | number) => {
  if (!v) return '$0.00'
  if (typeof v === 'string' && v.includes('$')) return v
  const n = typeof v === 'number' ? v : parseFloat(v || "0")
  return n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`
}

const getProfitNum = (v: string | number) => {
  if (!v) return 0
  if (typeof v === 'string' && v.includes('$')) return parseFloat(v.replace(/[$+\-,]/g, '')) * (v.includes('-') ? -1 : 1)
  return typeof v === 'number' ? v : parseFloat(v || "0")
}

const fmtDate = (s?: string) => {
  if (!s || s === 'N/A') return '—'
  try {
    const d = new Date(s.includes(' ') ? s.replace(/\./g, '-').replace(' ', 'T') : s)
    return isNaN(d.getTime()) ? s : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return s }
}

const TradingContest = () => {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const [openData, setOpenData] = useState<OpenTradesResponse | null>(null)
  const [closedData, setClosedData] = useState<ClosedTradesResponse | null>(null)

  const fetchOpenTrades = useCallback(async () => {
    if (isPending) return
    setIsPending(true); setIsLoading(true)
    try {
      const token = localStorage.getItem('clientToken')
      const res = await fetch(`${API_BASE_URL}/api/trading/open`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success !== false) setOpenData(json)
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsPending(false) }
  }, [isPending])

  const fetchClosedTrades = useCallback(async () => {
    if (isPending) return
    setIsPending(true); setIsLoading(true)
    try {
      const token = localStorage.getItem('clientToken')
      const res = await fetch(`${API_BASE_URL}/api/trading/closed`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success !== false) setClosedData(json)
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsPending(false) }
  }, [isPending])

  useEffect(() => {
    if (activeTab === 'open') fetchOpenTrades()
    else fetchClosedTrades()
    setCurrentPage(1)
    setSearchTerm('')
  }, [activeTab])

  const handleRefresh = () => {
    if (activeTab === 'open') fetchOpenTrades()
    else fetchClosedTrades()
  }

  const currentTrades: Trade[] = activeTab === 'open'
    ? (openData?.trades || [])
    : (closedData?.trades || [])

  const filtered = currentTrades.filter(t =>
    !searchTerm ||
    t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ticket?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.account?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Stats
  const totalProfit = filtered.reduce((s, t) => s + getProfitNum(t.profit), 0)
  const profitableTrades = filtered.filter(t => getProfitNum(t.profit) > 0).length
  const winRate = filtered.length > 0 ? (profitableTrades / filtered.length * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text-primary)' }}>Contest Trades</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Monitor your open and closed positions
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleRefresh} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Trades', val: filtered.length.toString(), color: '#6366f1', icon: Activity },
          { label: 'Total P&L', val: fmtProfit(totalProfit), color: totalProfit >= 0 ? '#10b981' : '#ef4444', icon: totalProfit >= 0 ? TrendingUp : TrendingDown },
          { label: 'Win Rate', val: `${winRate}%`, color: '#f59e0b', icon: Zap },
          { label: 'Profitable', val: profitableTrades.toString(), color: '#10b981', icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.04 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${s.color}18` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
              <p className="text-sm font-bold font-mono truncate" style={{ color: s.color }}>{s.val}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tabs + Search ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl gap-1"
          style={{ background: 'var(--theme-border)' }}>
          {(['open', 'closed'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{ color: activeTab === tab ? 'white' : 'var(--theme-text-muted)' }}>
              {activeTab === tab && (
                <motion.div layoutId="contestTab" className="absolute inset-0 rounded-lg"
                  style={{ background: '#6366f1' }} />
              )}
              <span className="relative z-10 capitalize flex items-center gap-1.5">
                {tab === 'open' ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{' '}Open</> : 'Closed'}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'var(--theme-bg-card)', color: 'inherit' }}>
                  {tab === 'open' ? (openData?.total || 0) : (closedData?.total || 0)}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
          <input
            type="text" placeholder="Search symbol, ticket…"
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
          />
        </div>
      </motion.div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading trades…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>No {activeTab} trades</p>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {searchTerm ? 'Try adjusting your search.' : `No ${activeTab} trades found.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {['Ticket', 'Symbol', 'Type', 'Volume', 'Open Price', activeTab === 'open' ? 'Current Price' : 'Close Price', 'Time', 'P&L'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginated.map((trade, idx) => {
                      const profit = getProfitNum(trade.profit)
                      const isProfit = profit > 0
                      return (
                        <motion.tr key={`${trade.ticket}-${idx}`}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="transition-colors duration-150"
                          style={{ borderBottom: '1px solid var(--theme-border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#6366f1' }}>#{trade.ticket}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                {trade.symbol?.slice(0, 2)}
                              </div>
                              <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{trade.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (trade.tradeType || trade.trade)?.toLowerCase().includes('buy') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: (trade.tradeType || trade.trade)?.toLowerCase().includes('buy') ? '#10b981' : '#ef4444',
                              }}>
                              {(trade.tradeType || trade.trade || '').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{trade.volume}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-primary)' }}>{fmtPrice(trade.openPrice)}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                            {activeTab === 'open' ? fmtPrice(trade.currentPrice) : fmtPrice(trade.closePrice)}
                          </td>
                          <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                            {fmtDate(trade.openTime)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {isProfit ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : profit < 0 ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
                              <span className="text-xs font-bold font-mono"
                                style={{ color: isProfit ? '#10b981' : profit < 0 ? '#ef4444' : 'var(--theme-text-muted)' }}>
                                {fmtProfit(trade.profit)}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y" style={{ borderColor: 'var(--theme-border)' }}>
              {paginated.map((trade, idx) => {
                const profit = getProfitNum(trade.profit)
                const isProfit = profit > 0
                const isBuy = (trade.tradeType || trade.trade || '').toLowerCase().includes('buy')
                return (
                  <motion.div key={`m-${trade.ticket}-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                          {trade.symbol?.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>{trade.symbol}</div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>#{trade.ticket}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono" style={{ color: isProfit ? '#10b981' : profit < 0 ? '#ef4444' : 'var(--theme-text-muted)' }}>
                          {fmtProfit(trade.profit)}
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isBuy ? '#10b981' : '#ef4444' }}>
                          {(trade.tradeType || trade.trade || '').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Open', val: fmtPrice(trade.openPrice) },
                        { label: activeTab === 'open' ? 'Current' : 'Close', val: activeTab === 'open' ? fmtPrice(trade.currentPrice) : fmtPrice(trade.closePrice) },
                        { label: 'Volume', val: trade.volume },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'var(--theme-border)' }}>
                          <p className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
                          <p className="text-[11px] font-mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>{s.val}</p>
                        </div>
                      ))}
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
                  {filtered.length} trades · Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg disabled:opacity-40" style={{ background: 'var(--theme-border)' }}>
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const page = Math.min(Math.max(currentPage - 2, 1) + i, totalPages)
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold"
                        style={{ background: currentPage === page ? '#6366f1' : 'var(--theme-border)', color: currentPage === page ? 'white' : 'var(--theme-text-muted)' }}>
                        {page}
                      </button>
                    )
                  })}
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
    </div>
  )
}

export default TradingContest
