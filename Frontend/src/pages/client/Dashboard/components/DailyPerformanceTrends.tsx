// Frontend/src/pages/client/dashboard/DailyPerformanceTrends.tsx
import React, { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, TrendingDown, ArrowUpDown, Users, UserPlus, BarChart3, RefreshCw } from "lucide-react"

/* ─── Types ─── */
interface DailyData {
  date: string
  formattedDate: string
  deposits: number
  withdrawals: number
  transactions: number
  tradingPnL: number
  newClients: number
  ibPartners: number
  depositsCount: number
  withdrawalsCount: number
  tradesCount: number
}
interface Summary {
  totalDeposits: number
  totalWithdrawals: number
  totalTransactions: number
  totalTradingPnL: number
  totalNewClients: number
  totalIBPartners: number
  depositsCount: number
  withdrawalsCount: number
  totalTrades: number
}
interface Changes {
  deposits: number
  withdrawals: number
  transactions: number
  tradingPnL: number
  newClients: number
  ibPartners: number
}
interface PerformanceData {
  chartData: DailyData[]
  summary: Summary
  changes: Changes
  period: string
  dateRange: { start: string; end: string }
}

type ChartFilter = "All" | "Financial" | "Users"
type ChartType = "Line" | "Area" | "Mixed"

/* ─── Colours that respect the theme via CSS vars ─── */
const LINE_COLORS = {
  deposits:     "var(--theme-success)",
  withdrawals:  "var(--theme-danger)",
  transactions: "var(--theme-warning)",
  newClients:   "var(--theme-info)",
  ibPartners:   "var(--theme-highlight)",
}

/* ─── Helpers ─── */
const fmtCurrency = (v: number) =>
  Math.abs(v) >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : Math.abs(v) >= 1_000
    ? `$${(v / 1_000).toFixed(1)}K`
    : `$${v.toLocaleString()}`

const fmtNum    = (v: number) => v.toLocaleString()
const fmtChange = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl p-3 shadow-2xl text-sm"
      style={{
        backgroundColor: "var(--theme-bg-card)",
        border: "1px solid var(--theme-border)",
        minWidth: 180,
      }}
    >
      <p className="mb-2 font-semibold text-xs" style={{ color: "var(--theme-text-muted)" }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: "var(--theme-text-muted)" }}>{entry.name}</span>
          </div>
          <span className="font-semibold" style={{ color: "var(--theme-text-primary)" }}>
            {["transactions","newClients","ibPartners"].includes(entry.dataKey)
              ? fmtNum(entry.value)
              : fmtCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Stat Card ─── */
const StatCard = ({
  title, value, change, icon: Icon, accentColor,
}: {
  title: string
  value: string
  change: number
  icon: React.ElementType
  accentColor: string
}) => (
  <div
    className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}
  >
    {/* Left accent bar */}
    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: accentColor }} />
    <div className="pl-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--theme-text-muted)" }}>{title}</p>
          <p className="text-xl font-bold" style={{ color: "var(--theme-text-primary)" }}>{value}</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: `${accentColor}22` }}>
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium"
        style={{ color: change > 0 ? "var(--theme-success)" : change < 0 ? "var(--theme-danger)" : "var(--theme-text-muted)" }}>
        {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        <span>{fmtChange(change)} vs prev period</span>
      </div>
    </div>
  </div>
)

/* ─── Filter/Type Button ─── */
const FilterBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
    style={{
      backgroundColor: active ? "var(--theme-primary)" : "var(--theme-bg-card)",
      color: active ? "#fff" : "var(--theme-text-muted)",
      border: `1px solid ${active ? "var(--theme-primary)" : "var(--theme-border)"}`,
    }}
  >
    {label}
  </button>
)

/* ─── Main Component ─── */
const DailyPerformanceTrends: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<ChartFilter>("All")
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("Area")
  const [days, setDays] = useState(30)

  useEffect(() => { fetchData() }, [days])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/daily-performance/trends?days=${days}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (!res.ok) throw new Error("Failed to fetch performance data")
      const result = await res.json()
      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const getVisibleLines = () => {
    const lines = [
      { key: "deposits",    name: "Deposits",     color: LINE_COLORS.deposits,     show: selectedFilter !== "Users" },
      { key: "withdrawals", name: "Withdrawals",  color: LINE_COLORS.withdrawals,  show: selectedFilter !== "Users" },
      { key: "transactions",name: "Transactions", color: LINE_COLORS.transactions, show: selectedFilter !== "Users" },
      { key: "newClients",  name: "New Clients",  color: LINE_COLORS.newClients,   show: selectedFilter !== "Financial" },
      { key: "ibPartners",  name: "IB Partners",  color: LINE_COLORS.ibPartners,   show: selectedFilter !== "Financial" },
    ]
    return lines.filter((l) => l.show)
  }

  const chartData = data?.chartData ?? []

  /* ─── Loading ─── */
  if (loading) return (
    <div className="rounded-2xl p-8 flex items-center justify-center h-80" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 animate-spin" style={{ color: "var(--theme-primary)" }} />
        <span style={{ color: "var(--theme-text-muted)" }}>Loading performance data…</span>
      </div>
    </div>
  )

  /* ─── Error ─── */
  if (error) return (
    <div className="rounded-2xl p-8 flex flex-col items-center justify-center h-80 gap-3" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
      <p className="text-sm" style={{ color: "var(--theme-danger)" }}>{error}</p>
      <button onClick={fetchData} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all" style={{ background: "var(--theme-primary)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--theme-primary-hover)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--theme-primary)" }}>
        Retry
      </button>
    </div>
  )

  if (!data) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5" style={{ background: "color-mix(in srgb, var(--theme-primary) 15%, transparent)" }}>
            <BarChart3 className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--theme-text-primary)" }}>Daily Performance Trends</h3>
            <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Last {days} days activity overview</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Financial", "Users"] as ChartFilter[]).map((f) => (
            <FilterBtn key={f} label={f} active={selectedFilter === f} onClick={() => setSelectedFilter(f)} />
          ))}
          <div className="h-4 w-px" style={{ background: "var(--theme-border)" }} />
          {(["Line", "Area", "Mixed"] as ChartType[]).map((t) => (
            <FilterBtn key={t} label={t} active={selectedChartType === t} onClick={() => setSelectedChartType(t)} />
          ))}
          <div className="h-4 w-px" style={{ background: "var(--theme-border)" }} />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
            style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-primary)" }}
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all"
            style={{ background: "var(--theme-primary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--theme-primary-hover)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--theme-primary)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-5" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <StatCard title="Deposits"    value={fmtCurrency(data.summary.totalDeposits)}    change={data.changes.deposits}    icon={TrendingUp}   accentColor={LINE_COLORS.deposits} />
        <StatCard title="Withdrawals" value={fmtCurrency(data.summary.totalWithdrawals)} change={data.changes.withdrawals} icon={TrendingDown} accentColor={LINE_COLORS.withdrawals} />
        <StatCard title="Transactions" value={fmtNum(data.summary.totalTransactions)}    change={data.changes.transactions} icon={ArrowUpDown}  accentColor={LINE_COLORS.transactions} />
        <StatCard title="New Clients" value={fmtNum(data.summary.totalNewClients)}        change={data.changes.newClients}   icon={Users}        accentColor={LINE_COLORS.newClients} />
        <StatCard title="IB Partners" value={fmtNum(data.summary.totalIBPartners)}        change={data.changes.ibPartners}   icon={UserPlus}     accentColor={LINE_COLORS.ibPartners} />
      </div>

      {/* ─── Chart ─── */}
      <div className="p-5">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === "Area" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  {getVisibleLines().map((l) => (
                    <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={l.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={l.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.5} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} tickFormatter={(v) => selectedFilter === "Users" ? fmtNum(v) : fmtCurrency(v)} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--theme-text-muted)" }} />
                {getVisibleLines().map((l) => (
                  <Area key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} fill={`url(#grad-${l.key})`} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                ))}
              </AreaChart>
            ) : selectedChartType === "Mixed" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  {getVisibleLines().slice(0, 2).map((l) => (
                    <linearGradient key={l.key} id={`grad2-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={l.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={l.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.5} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} tickFormatter={(v) => selectedFilter === "Users" ? fmtNum(v) : fmtCurrency(v)} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--theme-text-muted)" }} />
                {getVisibleLines().map((l, i) =>
                  i < 2 ? (
                    <Area key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} fill={`url(#grad2-${l.key})`} dot={false} activeDot={{ r: 5 }} />
                  ) : (
                    <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
                  )
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.5} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--theme-text-disabled)" }} axisLine={false} tickLine={false} tickFormatter={(v) => selectedFilter === "Users" ? fmtNum(v) : fmtCurrency(v)} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--theme-text-muted)" }} />
                {getVisibleLines().map((l) => (
                  <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DailyPerformanceTrends
