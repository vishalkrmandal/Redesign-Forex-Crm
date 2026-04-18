// Frontend/src/pages/client/Dashboard/components/ActiveAccounts.tsx
import { useState } from "react"
import { AlertCircle, ChevronUp, ChevronDown, CreditCard, RefreshCw, MoreHorizontal } from "lucide-react"

const SERVER_NAME = import.meta.env.VITE_SERVER_NAME

type ActiveAccount = {
  _id: string
  name: string
  accountType: string
  mt5Account: string
  balance: number
  equity: number
  profitLoss: number
  leverage: string
}

interface ActiveAccountsProps {
  accounts: ActiveAccount[]
  theme: any
  onRefresh: () => Promise<void>
}

const ACCOUNT_TYPE_COLORS: Record<string, { text: string; bg: string }> = {
  standard: { text: "var(--theme-info)", bg: "color-mix(in srgb, var(--theme-info)      18%, transparent)" },
  pro: { text: "var(--theme-highlight)", bg: "color-mix(in srgb, var(--theme-highlight) 18%, transparent)" },
  vip: { text: "var(--theme-warning)", bg: "color-mix(in srgb, var(--theme-warning)   18%, transparent)" },
}

function getTypeColor(type: string) {
  return ACCOUNT_TYPE_COLORS[type.toLowerCase()] ?? {
    text: "var(--theme-text-muted)",
    bg: "color-mix(in srgb, var(--theme-text-muted) 12%, transparent)",
  }
}

const ActiveAccounts: React.FC<ActiveAccountsProps> = ({ accounts, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl p-2.5"
            style={{ background: "color-mix(in srgb, var(--theme-info) 15%, transparent)" }}
          >
            <CreditCard className="h-5 w-5" style={{ color: "var(--theme-info)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--theme-text-primary)" }}>Active Accounts</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
              </span>
              {SERVER_NAME && (
                <>
                  <span style={{ color: "var(--theme-border)" }}>·</span>
                  <span className="text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>{SERVER_NAME}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            color: "var(--theme-text-muted)",
            border: "1px solid var(--theme-border)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            ; (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-primary)"
              ; (e.currentTarget as HTMLElement).style.color = "var(--theme-primary)"
          }}
          onMouseLeave={(e) => {
            ; (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)"
              ; (e.currentTarget as HTMLElement).style.color = "var(--theme-text-muted)"
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── Account List ─── */}
      <div className="max-h-96 overflow-y-auto scrollbar-hidden">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle className="h-10 w-10" style={{ color: "var(--theme-text-disabled)" }} />
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>No active accounts found</p>
            <p className="text-xs" style={{ color: "var(--theme-text-disabled)" }}>Connect your trading accounts to get started</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--theme-border)" }}>
            {accounts.map((account) => {
              const typeColor = getTypeColor(account.accountType)
              const isPnlPositive = (account.profitLoss || 0) >= 0
              const PnlIcon = isPnlPositive ? ChevronUp : ChevronDown

              return (
                <div
                  key={account._id}
                  className="p-4 transition-all duration-200 cursor-pointer group"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--theme-primary) 4%, transparent)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--theme-text-primary)" }}>{account.name}</span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: typeColor.text, backgroundColor: typeColor.bg }}
                        >
                          {account.accountType}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
                        MT5: <span className="font-mono">{account.mt5Account}</span>
                      </p>
                    </div>
                    <button
                      className="rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--theme-text-muted)" }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Balance */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg-main) 60%, transparent)" }}
                    >
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--theme-text-disabled)" }}>Balance</p>
                      <p className="text-sm font-bold" style={{ color: "var(--theme-text-primary)" }}>
                        ${(account.balance || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Equity */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg-main) 60%, transparent)" }}
                    >
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--theme-text-disabled)" }}>Equity</p>
                      <p className="text-sm font-bold" style={{ color: "var(--theme-text-primary)" }}>
                        ${(account.equity || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* P&L */}
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: `color-mix(in srgb, ${isPnlPositive ? "var(--theme-success)" : "var(--theme-danger)"} 10%, transparent)` }}
                    >
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--theme-text-disabled)" }}>P&L</p>
                      <p
                        className="text-sm font-bold flex items-center gap-0.5"
                        style={{ color: isPnlPositive ? "var(--theme-success)" : "var(--theme-danger)" }}
                      >
                        <PnlIcon className="h-3.5 w-3.5" />
                        {isPnlPositive && "+"}{(account.profitLoss || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid var(--theme-border)" }}>
                    <span className="text-[10px]" style={{ color: "var(--theme-text-disabled)" }}>
                      Leverage: <span className="font-semibold" style={{ color: "var(--theme-text-muted)" }}>{account.leverage}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--theme-success)" }} />
                      <span className="text-[10px]" style={{ color: "var(--theme-success)" }}>Active</span>
                    </div>
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

export default ActiveAccounts
