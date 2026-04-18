// Frontend/src/pages/admin/dashboard/component/RevenueChart.tsx
import React, { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface RevenueChartProps {
  data: Array<{
    month: string;
    deposits: number;
    withdrawals: number;
    net: number;
  }>;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);

const fmtFull = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-2xl text-xs min-w-[150px]"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <p className="font-bold mb-2 text-sm" style={{ color: 'var(--theme-text-primary)' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: 'var(--theme-text-muted)' }}>{entry.name}</span>
          </div>
          <span className="font-semibold" style={{ color: entry.color }}>{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [hideLine, setHideLine] = useState<Record<string, boolean>>({});

  const totalDeposits = data.reduce((s, d) => s + d.deposits, 0);
  const totalWithdrawals = data.reduce((s, d) => s + d.withdrawals, 0);
  const netRevenue = totalDeposits - totalWithdrawals;

  const summaryCards = [
    { label: 'Total Deposits', value: fmtFull(totalDeposits), icon: ArrowDownCircle, color: '#10b981' },
    { label: 'Total Withdrawals', value: fmtFull(totalWithdrawals), icon: ArrowUpCircle, color: '#ef4444' },
    { label: 'Net Revenue', value: fmtFull(netRevenue), icon: DollarSign, color: netRevenue >= 0 ? '#6366f1' : '#ef4444' },
  ];

  const toggle = (key: string) => setHideLine(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="rounded-2xl p-5 h-full flex flex-col"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Revenue Analytics</h3>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Last 12 months performance</p>
          </div>
        </div>

        {/* Legend toggles */}
        <div className="flex items-center gap-2">
          {[
            { key: 'deposits', label: 'Deposits', color: '#10b981' },
            { key: 'withdrawals', label: 'Withdrawals', color: '#ef4444' },
            { key: 'net', label: 'Net', color: '#6366f1' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: hideLine[item.key] ? 'transparent' : `${item.color}15`,
                border: `1px solid ${hideLine[item.key] ? 'var(--theme-border)' : item.color + '40'}`,
                color: hideLine[item.key] ? 'var(--theme-text-disabled)' : item.color,
                textDecoration: hideLine[item.key] ? 'line-through' : 'none',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: hideLine[item.key] ? 'var(--theme-border)' : item.color }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {summaryCards.map(card => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3"
            style={{ background: `${card.color}10`, border: `1px solid ${card.color}30` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <p className="text-[10px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{card.label}</p>
            </div>
            <p className="text-sm font-bold" style={{ color: card.color }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradDeposits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradWithdrawals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => fmt(v)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />

            {!hideLine['deposits'] && (
              <Area type="monotone" dataKey="deposits" name="Deposits"
                stroke="#10b981" strokeWidth={2} fill="url(#gradDeposits)"
                dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: 'var(--theme-bg-card)', strokeWidth: 2 }}
              />
            )}
            {!hideLine['withdrawals'] && (
              <Area type="monotone" dataKey="withdrawals" name="Withdrawals"
                stroke="#ef4444" strokeWidth={2} fill="url(#gradWithdrawals)"
                dot={false} activeDot={{ r: 5, fill: '#ef4444', stroke: 'var(--theme-bg-card)', strokeWidth: 2 }}
              />
            )}
            {!hideLine['net'] && (
              <Line type="monotone" dataKey="net" name="Net Revenue"
                stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 4"
                dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: 'var(--theme-bg-card)', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
