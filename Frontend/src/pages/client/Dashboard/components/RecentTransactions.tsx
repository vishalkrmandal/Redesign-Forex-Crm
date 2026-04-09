// Frontend/src/pages/client/Dashboard/components/RecentTransactions.tsx
import { useState } from "react"
import { History, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, ChevronRight, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "transfer"
  amount: number
  status: "Pending" | "Approved" | "Rejected" | "Processing"
  date: string
  processedDate?: string
  account?: string
  paymentMethod?: string
  fromAccount?: string
  toAccount?: string
  createdAt: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  theme: "light" | "dark"
  onRefresh: () => void
}

const TYPE_CONFIG = {
  deposit:    { icon: ArrowDownCircle, color: "var(--theme-success)",  label: "Deposit"    },
  withdrawal: { icon: ArrowUpCircle,   color: "var(--theme-danger)",   label: "Withdrawal" },
  transfer:   { icon: ArrowRightLeft,  color: "var(--theme-info)",     label: "Transfer"   },
}

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  approved:   { text: "var(--theme-success)",  bg: "color-mix(in srgb, var(--theme-success)  15%, transparent)" },
  pending:    { text: "var(--theme-warning)",  bg: "color-mix(in srgb, var(--theme-warning)  15%, transparent)" },
  rejected:   { text: "var(--theme-danger)",   bg: "color-mix(in srgb, var(--theme-danger)   15%, transparent)" },
  processing: { text: "var(--theme-info)",     bg: "color-mix(in srgb, var(--theme-info)     15%, transparent)" },
}

function getStatus(s: string) {
  return STATUS_COLORS[s.toLowerCase()] ?? { text: "var(--theme-text-muted)", bg: "color-mix(in srgb, var(--theme-text-muted) 12%, transparent)" }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

type Filter = "all" | "deposit" | "withdrawal" | "transfer"

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onRefresh }) => {
  const [filter, setFilter] = useState<Filter>("all")
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 800)
  }

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}
    >
      {/* ─── Header ─── */}
      <div className="p-5" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "color-mix(in srgb, var(--theme-highlight) 15%, transparent)" }}
            >
              <History className="h-5 w-5" style={{ color: "var(--theme-highlight)" }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--theme-text-primary)" }}>Recent Transactions</h3>
              <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Latest activity on your accounts</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg p-2 transition-all duration-200 disabled:opacity-50"
            style={{ color: "var(--theme-text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--theme-primary)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--theme-text-muted)" }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "deposit", "withdrawal", "transfer"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200"
              style={{
                backgroundColor: filter === f ? "var(--theme-primary)" : "transparent",
                color: filter === f ? "#fff" : "var(--theme-text-muted)",
                border: `1px solid ${filter === f ? "var(--theme-primary)" : "var(--theme-border)"}`,
              }}
            >
              {f === "all" ? `All (${transactions.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── List ─── */}
      <div className="max-h-80 overflow-y-auto scrollbar-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <History className="h-10 w-10" style={{ color: "var(--theme-text-disabled)" }} />
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>No transactions found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--theme-border)" }}>
            {filtered.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.deposit
              const TxIcon = cfg.icon
              const statusStyle = getStatus(tx.status)
              const isDebit = tx.type === "withdrawal" || tx.type === "transfer"

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-all duration-200 cursor-pointer group"
                  style={{ borderColor: "var(--theme-border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--theme-primary) 4%, transparent)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${cfg.color}18` }}
                  >
                    <TxIcon className="h-4 w-4" style={{ color: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium capitalize" style={{ color: "var(--theme-text-primary)" }}>
                        {tx.type}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: statusStyle.text, backgroundColor: statusStyle.bg }}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
                      {tx.type === "transfer"
                        ? `${tx.fromAccount} → ${tx.toAccount}`
                        : `${tx.account ?? ""} • ${tx.paymentMethod ?? ""}`}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--theme-text-disabled)" }}>
                      {fmtDate(tx.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: isDebit ? "var(--theme-danger)" : "var(--theme-success)" }}
                    >
                      {isDebit ? "-" : "+"}{fmtCurrency(tx.amount)}
                    </p>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--theme-text-disabled)" }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentTransactions
