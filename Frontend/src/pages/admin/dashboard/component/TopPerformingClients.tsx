// Frontend/src/pages/admin/dashboard/component/TopPerformingClients.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User, Calendar, CreditCard, TrendingUp, Crown, Medal, Award, Star } from 'lucide-react';

interface Client {
  _id: string;
  totalDeposited: number;
  depositCount: number;
  user: { firstname: string; lastname: string; email: string; createdAt: string };
  accountsCount: number;
}

interface TopPerformingClientsProps {
  clients: Client[];
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);

const fmtFull = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const RANK_CONFIG = [
  { icon: Crown, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', label: 'Gold', ring: '#f59e0b' },
  { icon: Medal, color: '#94a3b8', bg: 'linear-gradient(135deg, #94a3b8, #64748b)', label: 'Silver', ring: '#94a3b8' },
  { icon: Award, color: '#f97316', bg: 'linear-gradient(135deg, #f97316, #ea580c)', label: 'Bronze', ring: '#f97316' },
];

const SORT_OPTS = [
  { key: 'amount', label: 'By Amount' },
  { key: 'deposits', label: 'By Count' },
  { key: 'accounts', label: 'By Accounts' },
];

const TopPerformingClients: React.FC<TopPerformingClientsProps> = ({ clients }) => {
  const [sortBy, setSortBy] = useState<'amount' | 'deposits' | 'accounts'>('amount');

  const sorted = [...clients].sort((a, b) => {
    if (sortBy === 'deposits') return b.depositCount - a.depositCount;
    if (sortBy === 'accounts') return b.accountsCount - a.accountsCount;
    return b.totalDeposited - a.totalDeposited;
  });

  const maxValue = sorted[0]?.totalDeposited || 1;
  const totalValue = clients.reduce((s, c) => s + c.totalDeposited, 0);
  const avgDeposits = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.depositCount, 0) / clients.length)
    : 0;

  const getInitials = (c: Client) =>
    `${c.user.firstname.charAt(0)}${c.user.lastname.charAt(0)}`.toUpperCase();

  return (
    <div className="rounded-2xl flex flex-col h-full max-h-[600px]"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

      {/* Header */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2" style={{ background: '#f59e0b18' }}>
              <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Top Performing Clients</h3>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Highest value by total deposits</p>
            </div>
          </div>
          <div className="flex gap-1">
            {SORT_OPTS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key as any)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: sortBy === opt.key ? '#f59e0b' : 'transparent',
                  color: sortBy === opt.key ? 'white' : 'var(--theme-text-muted)',
                  border: `1px solid ${sortBy === opt.key ? '#f59e0b' : 'transparent'}`,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Value', value: fmtCurrency(totalValue), color: '#f59e0b' },
            { label: 'Avg Deposits', value: avgDeposits.toString(), color: '#6366f1' },
            { label: 'Top Clients', value: clients.length.toString(), color: '#10b981' },
          ].map(item => (
            <div key={item.label} className="rounded-xl px-3 py-2 text-center"
              style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
              <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Clients list */}
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Trophy className="w-10 h-10" style={{ color: 'var(--theme-text-disabled)' }} />
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No clients found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {sorted.map((client, idx) => {
                const rankCfg = RANK_CONFIG[idx];
                const pct = Math.round((client.totalDeposited / maxValue) * 100);
                const isTop3 = idx < 3;

                return (
                  <motion.div
                    key={client._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-xl p-3 relative overflow-hidden"
                    style={{
                      background: isTop3
                        ? `linear-gradient(135deg, ${rankCfg.color}10, transparent)`
                        : 'color-mix(in srgb, var(--theme-primary) 4%, transparent)',
                      border: `1px solid ${isTop3 ? rankCfg.color + '30' : 'var(--theme-border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge + Avatar */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: isTop3 ? rankCfg.bg : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                        >
                          {getInitials(client)}
                        </div>
                        {isTop3 && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: rankCfg.bg, border: '1.5px solid var(--theme-bg-card)' }}>
                            <rankCfg.icon className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {!isTop3 && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ background: '#6366f1', border: '1.5px solid var(--theme-bg-card)' }}>
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Client info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                              {client.user.firstname} {client.user.lastname}
                            </span>
                            {isTop3 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: `${rankCfg.color}20`, color: rankCfg.color }}>
                                {rankCfg.label}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: isTop3 ? rankCfg.color : 'var(--theme-text-primary)' }}>
                            {fmtCurrency(client.totalDeposited)}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 text-[10px] mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-2.5 h-2.5" />{client.user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5" />{client.depositCount} deposits
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-2.5 h-2.5" />{client.accountsCount} accounts
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />Joined {fmtDate(client.user.createdAt)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.06, ease: 'easeOut' }}
                            style={{
                              background: isTop3
                                ? rankCfg.bg
                                : 'linear-gradient(90deg, #6366f1, #4f46e5)',
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[9px]" style={{ color: 'var(--theme-text-disabled)' }}>Performance</span>
                          <span className="text-[9px] font-semibold" style={{ color: isTop3 ? rankCfg.color : 'var(--theme-text-muted)' }}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformingClients;
