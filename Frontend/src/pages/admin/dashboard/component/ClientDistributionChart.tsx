// Frontend/src/pages/admin/dashboard/component/ClientDistributionChart.tsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientDistributionChartProps {
  data: Array<{ name: string; value: number; percentage: string }>;
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6b7280',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl p-3 shadow-2xl text-xs"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <p className="font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{d.name}</p>
      <p style={{ color: 'var(--theme-text-muted)' }}>{d.value} accounts · <span style={{ color: 'var(--theme-primary)' }}>{d.percentage}%</span></p>
    </div>
  );
};

const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = data.filter(d => !hidden.has(d.name));
  const total = data.reduce((s, d) => s + d.value, 0);
  const types = data.length;

  const toggle = (name: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="rounded-2xl p-5 flex flex-col"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2" style={{ background: '#8b5cf615' }}>
            <Users className="w-4 h-4" style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Account Distribution</h3>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>By account type ({total} total accounts)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="px-3 py-1.5 rounded-xl" style={{ background: '#8b5cf610', border: '1px solid #8b5cf625' }}>
            <p className="text-xs font-bold" style={{ color: '#8b5cf6' }}>{types}</p>
            <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Types</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: '#6366f110', border: '1px solid #6366f125' }}>
            <p className="text-xs font-bold" style={{ color: '#6366f1' }}>{total}</p>
            <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Accounts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
        {/* Donut chart */}
        <div className="relative h-56 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visible}
                cx="50%" cy="50%"
                innerRadius="42%"
                outerRadius="68%"
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                strokeWidth={0}
              >
                {visible.map((entry, idx) => {
                  const colorIdx = data.findIndex(d => d.name === entry.name);
                  return (
                    <Cell
                      key={entry.name}
                      fill={COLORS[colorIdx % COLORS.length]}
                      opacity={activeIdx === null || activeIdx === idx ? 1 : 0.45}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s, filter 0.2s', filter: activeIdx === idx ? 'brightness(1.2)' : 'none' }}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {activeIdx !== null && visible[activeIdx] ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={visible[activeIdx].name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold" style={{ color: COLORS[data.findIndex(d => d.name === visible[activeIdx].name) % COLORS.length] }}>
                    {visible[activeIdx].percentage}%
                  </p>
                  <p className="text-[10px] max-w-[80px] text-center leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
                    {visible[activeIdx].name}
                  </p>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>{total}</p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Accounts</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend with bars */}
        <div className="space-y-2 overflow-y-auto max-h-64 lg:max-h-none pr-1">
          {data.map((entry, idx) => {
            const color = COLORS[idx % COLORS.length];
            const isHidden = hidden.has(entry.name);
            const pct = total > 0 ? (entry.value / total) * 100 : 0;

            return (
              <motion.button
                key={entry.name}
                onClick={() => toggle(entry.name)}
                whileHover={{ x: 2 }}
                className="w-full text-left rounded-xl p-2.5 transition-all"
                style={{
                  background: isHidden ? 'transparent' : `${color}08`,
                  border: `1px solid ${isHidden ? 'var(--theme-border)' : color + '30'}`,
                  opacity: isHidden ? 0.45 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, opacity: isHidden ? 0.4 : 1 }} />
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{entry.value}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}20`, color }}>
                      {entry.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: `${color}15` }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isHidden ? '0%' : `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.04 }}
                    style={{ background: color }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientDistributionChart;
