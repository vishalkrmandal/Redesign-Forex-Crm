// Frontend/src/pages/admin/dashboard/component/RecentTransactions.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft,
  Calendar, CreditCard, Filter
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  user: { name: string; email: string };
  account: string;
  status: string;
  date: string;
  paymentMethod: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  deposit: { icon: TrendingUp, color: '#10b981', label: 'Deposit' },
  withdrawal: { icon: TrendingDown, color: '#ef4444', label: 'Withdrawal' },
  transfer: { icon: ArrowRightLeft, color: '#6366f1', label: 'Transfer' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  approved: { bg: '#10b98115', text: '#10b981', dot: '#10b981' },
  pending: { bg: '#f59e0b15', text: '#f59e0b', dot: '#f59e0b' },
  rejected: { bg: '#ef444415', text: '#ef4444', dot: '#ef4444' },
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'transfer', label: 'Transfers' },
];

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const filtered = transactions.filter(t => filter === 'all' || t.type.toLowerCase() === filter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'amount' ? b.amount - a.amount : new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalByType = (type: string) =>
    transactions.filter(t => t.type.toLowerCase() === type).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-2xl flex flex-col h-full max-h-[600px]"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

      {/* Header */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2" style={{ background: 'color-mix(in srgb, #6366f1 15%, transparent)' }}>
              <ArrowUpDown className="w-4 h-4" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Recent Transactions</h3>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Latest financial activities</p>
            </div>
          </div>
          <button
            onClick={() => setSortBy(s => s === 'date' ? 'amount' : 'date')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)', border: '1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
          >
            <Filter className="w-3 h-3" />
            {sortBy === 'date' ? 'By Date' : 'By Amount'}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: filter === tab.key ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-primary) 8%, transparent)',
                color: filter === tab.key ? 'white' : 'var(--theme-text-muted)',
                border: `1px solid ${filter === tab.key ? 'var(--theme-primary)' : 'transparent'}`,
              }}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {transactions.filter(t => t.type.toLowerCase() === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
            <ArrowUpDown className="w-10 h-10" style={{ color: 'var(--theme-text-disabled)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>No transactions found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
            <AnimatePresence initial={false}>
              {sorted.map((txn, idx) => {
                const type = txn.type.toLowerCase();
                const cfg = TYPE_CONFIG[type] || { icon: ArrowUpDown, color: '#6b7280', label: txn.type };
                const statusCfg = STATUS_CONFIG[txn.status?.toLowerCase()] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const sign = type === 'withdrawal' ? '-' : '+';

                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3 transition-colors"
                    style={{ cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--theme-primary) 4%, transparent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cfg.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                          {txn.user.name}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: statusCfg.bg, color: statusCfg.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                          {txn.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>
                        <span className="truncate">{txn.user.email}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 flex-shrink-0">
                          <CreditCard className="w-2.5 h-2.5" />{txn.account}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
                          <Calendar className="w-2.5 h-2.5" />{fmtDate(txn.date)}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: cfg.color }}>
                        {sign}{fmtCurrency(txn.amount)}
                      </p>
                      <p className="text-[10px] sm:hidden mt-0.5" style={{ color: 'var(--theme-text-disabled)' }}>
                        {fmtDate(txn.date)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--theme-primary) 3%, transparent)' }}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Deposits', value: fmtCurrency(totalByType('deposit')), color: '#10b981' },
            { label: 'Withdrawals', value: fmtCurrency(totalByType('withdrawal')), color: '#ef4444' },
            { label: 'Transfers', value: fmtCurrency(totalByType('transfer')), color: '#6366f1' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</p>
              <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
