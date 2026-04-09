// Frontend/src/pages/client/Dashboard/components/DashboardStats.tsx
import { Wallet, TrendingUp, TrendingDown, CreditCard, Activity } from "lucide-react"

interface DashboardStatsProps {
  data: {
    totalBalance: string
    totalEquity: string
    totalDeposits: string
    totalWithdrawals: string
    totalMt5Accounts: number
    netBalance: string
  }
  theme: "light" | "dark"
}

const fmtCurrency = (s: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(parseFloat(s))

const STATS = (data: DashboardStatsProps["data"]) => [
  {
    id: "balance",
    label: "Total Balance",
    value: fmtCurrency(data.totalBalance),
    icon: Wallet,
    accent: "var(--theme-info)",
    sub: "Across all accounts",
    trend: "up" as const,
  },
  {
    id: "equity",
    label: "Total Equity",
    value: fmtCurrency(data.totalEquity),
    icon: TrendingUp,
    accent: "var(--theme-primary)",
    sub: "Current equity value",
    trend: "up" as const,
  },
  {
    id: "deposits",
    label: "Total Deposits",
    value: fmtCurrency(data.totalDeposits),
    icon: TrendingUp,
    accent: "var(--theme-success)",
    sub: "Lifetime deposits",
    trend: "up" as const,
  },
  {
    id: "withdrawals",
    label: "Total Withdrawals",
    value: fmtCurrency(data.totalWithdrawals),
    icon: TrendingDown,
    accent: "var(--theme-danger)",
    sub: "Lifetime withdrawals",
    trend: "down" as const,
  },
  {
    id: "accounts",
    label: "MT5 Accounts",
    value: data.totalMt5Accounts.toString(),
    icon: CreditCard,
    accent: "var(--theme-highlight)",
    sub: "Active trading accounts",
    trend: "neutral" as const,
  },
]

const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  const stats = STATS(data)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.id}
            className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
            style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: stat.accent }}
            />

            {/* Glow on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top, ${stat.accent}10 0%, transparent 70%)` }}
            />

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-2" style={{ color: "var(--theme-text-muted)" }}>{stat.label}</p>
                <p
                  className="text-xl font-bold truncate"
                  style={{ color: stat.id === "balance" || stat.id === "equity" ? "var(--theme-text-primary)" : stat.accent }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "var(--theme-text-disabled)" }}>{stat.sub}</p>
              </div>

              <div
                className="rounded-xl p-2.5 flex-shrink-0 ml-2 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${stat.accent}18` }}
              >
                <Icon className="h-5 w-5" style={{ color: stat.accent }} />
              </div>
            </div>

            {/* Trend indicator */}
            {stat.trend !== "neutral" && (
              <div
                className="mt-3 flex items-center gap-1 text-[10px] font-medium"
                style={{ color: stat.trend === "up" ? "var(--theme-success)" : "var(--theme-danger)" }}
              >
                {stat.trend === "up"
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                <span>{stat.trend === "up" ? "Positive performance" : "Monitor withdrawals"}</span>
              </div>
            )}
            {stat.trend === "neutral" && (
              <div
                className="mt-3 flex items-center gap-1 text-[10px] font-medium"
                style={{ color: "var(--theme-success)" }}
              >
                <Activity className="h-3 w-3" />
                <span>All accounts active</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DashboardStats
