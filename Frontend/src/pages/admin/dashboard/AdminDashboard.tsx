// Frontend/src/pages/admin/dashboard/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import RevenueChart from './component/RevenueChart';
import ClientDistributionChart from './component/ClientDistributionChart';
import RecentTransactions from './component/RecentTransactions';
import TopPerformingClients from './component/TopPerformingClients';
import adminDashboardApi from '../../../services/adminDashboardApi';
import {
  Activity, RefreshCw, AlertCircle, Wifi, WifiOff,
  TrendingUp, TrendingDown, Users, DollarSign, BarChart3,
  ArrowDownCircle, ArrowUpCircle, CreditCard, UserCheck,
  ArrowRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  stats: {
    clients: { total: number; today: number; thisWeek: number; thisMonth: number; growth: number; pending: number };
    deposits: { total: number; count: number; today: number; pending: number; growth: number };
    withdrawals: { total: number; count: number; pending: number; growth: number };
    transactions: { total: number; growth: number };
    ibPartners: { total: number; pending: number; growth: number };
    accounts: { total: number; today: number; growth: number };
  };
  revenueData: Array<{ month: string; deposits: number; withdrawals: number; net: number }>;
  clientDistribution: Array<{ name: string; value: number; percentage: string }>;
  recentTransactions: Array<{
    id: string; type: string; amount: number;
    user: { name: string; email: string };
    account: string; status: string; date: string; paymentMethod: string;
  }>;
  dailyStats: Array<{ date: string; clients: number; deposits: number; withdrawals: number; transactions: number; ibPartners: number }>;
  topClients: Array<{
    _id: string; totalDeposited: number; depositCount: number;
    user: { firstname: string; lastname: string; email: string; createdAt: string };
    accountsCount: number;
  }>;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);

const fmtFull = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

// const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-xl text-xs"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      {label && <p className="font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color || entry.fill }} />
          <span style={{ color: 'var(--theme-text-muted)' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {typeof entry.value === 'number' && entry.value > 100 ? fmtCurrency(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
const MiniSparkline = ({ data, color, dataKey }: { data: any[]; color: string; dataKey: string }) => (
  <ResponsiveContainer width="100%" height={44}>
    <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5}
        fill={`url(#spark-${dataKey})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Metric Card with Sparkline ───────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: Icon, accent, growth, badge, onClick, sparkData, sparkKey }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; growth?: number;
  badge?: { label: string; color: string };
  onClick?: () => void;
  sparkData?: any[];
  sparkKey?: string;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: `1px solid ${hovered && onClick ? accent + '60' : 'var(--theme-border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hovered && onClick ? `0 8px 30px ${accent}18` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        minHeight: '140px',
      }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      {/* Subtle bg glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-8 translate-x-8"
        style={{ background: accent }} />

      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="rounded-xl p-2" style={{ background: `${accent}18` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${badge.color}20`, color: badge.color }}>
                {badge.label}
              </span>
            )}
            {onClick && (
              <ArrowRight className="h-3 w-3 transition-all"
                style={{ color: accent, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-4px)' }} />
            )}
          </div>
        </div>

        <p className="text-xl font-bold leading-tight mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-disabled)' }}>{sub}</p>}
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && sparkKey && (
        <div className="mt-2 -mx-1">
          <MiniSparkline data={sparkData} color={accent} dataKey={sparkKey} />
        </div>
      )}

      {typeof growth === 'number' && (
        <div className="flex items-center gap-1 text-[10px] font-medium mt-1"
          style={{ color: growth >= 0 ? '#10b981' : '#ef4444' }}>
          {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</span>
          <span style={{ color: 'var(--theme-text-disabled)' }}>vs last period</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, icon: Icon, action, children, className = '' }: {
  title: string; subtitle?: string; icon?: React.ElementType;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-5 ${className}`}
    style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-xl p-2" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
            <Icon className="h-4 w-4" style={{ color: 'var(--theme-primary)' }} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{title}</h3>
          {subtitle && <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action.onClick}
          className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-primary)' }}>
          {action.label}<ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

// ─── Pending Actions ─────────────────────────────────────────────────────────
const PendingActions = ({ data }: { data: Array<{ name: string; value: number; total: number; fill: string }> }) => {
  const totalPending = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-3">
      {totalPending === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#10b98115' }}>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-medium" style={{ color: '#10b981' }}>All clear!</p>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>No pending items</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-1">
            <p className="text-3xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>{totalPending}</p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>total pending actions</p>
          </div>
          {data.map((item) => {
            const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>{item.value}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${item.fill}18`, color: item.fill }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${item.fill}20` }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.fill }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ─── Growth Rate Chart ────────────────────────────────────────────────────────
const GrowthRateChart = ({ data }: { data: Array<{ name: string; growth: number; fill: string }> }) => (
  <div className="h-52">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--theme-text-muted)' }} axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`} />
        <RechartsTooltip content={<CustomTooltip />} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Growth']} />
        <Bar dataKey="growth" radius={[6, 6, 0, 0]} maxBarSize={52}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.growth >= 0 ? entry.fill : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setError(null);
      const data = await adminDashboardApi.getAllDashboardData();
      if (data?.stats) {
        setDashboardData(data as DashboardData);
      } else {
        setError('Dashboard data is incomplete.');
      }
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Loading skeleton — mirrors the live layout structure exactly
  if (loading) {
    return (
      <div className="space-y-5 pb-6 animate-pulse">
        {/* Hero header */}
        <div className="h-24 rounded-2xl" style={{ background: 'var(--theme-border)' }} />
        {/* 6 metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
        {/* Revenue chart (2/3) + Pending actions (1/3) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 h-64 rounded-2xl" style={{ background: 'var(--theme-border)' }} />
          <div className="h-64 rounded-2xl" style={{ background: 'var(--theme-border)' }} />
        </div>
        {/* Client distribution + Growth rate */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-72 rounded-2xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
        {/* Quick navigation row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
        {/* Recent transactions + Top clients */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => <div key={i} className="h-80 rounded-2xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center rounded-2xl p-10 max-w-sm w-full"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Failed to Load</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--theme-text-muted)' }}>{error}</p>
          <button onClick={() => fetchDashboardData()}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--theme-primary)' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const s = dashboardData!.stats;

  // Spark data from daily stats
  const sparkDeposits = dashboardData?.dailyStats?.slice(-7).map(d => ({ v: d.deposits })) || [];
  const sparkClients = dashboardData?.dailyStats?.slice(-7).map(d => ({ v: d.clients })) || [];
  const sparkWithdrawals = dashboardData?.dailyStats?.slice(-7).map(d => ({ v: d.withdrawals })) || [];
  const sparkTxn = dashboardData?.dailyStats?.slice(-7).map(d => ({ v: d.transactions })) || [];

  const pendingData = [
    { name: 'Clients', value: s.clients.pending, total: s.clients.total, fill: '#6366f1' },
    { name: 'Deposits', value: s.deposits.pending, total: s.deposits.count, fill: '#10b981' },
    { name: 'Withdrawals', value: s.withdrawals.pending, total: s.withdrawals.count, fill: '#ef4444' },
    { name: 'IB Partners', value: s.ibPartners.pending, total: s.ibPartners.total, fill: '#f59e0b' },
  ].filter(d => d.total > 0 || d.value > 0);

  const growthData = [
    { name: 'Clients', growth: s.clients.growth, fill: '#6366f1' },
    { name: 'Deposits', growth: s.deposits.growth, fill: '#10b981' },
    { name: 'Withdrawals', growth: s.withdrawals.growth, fill: '#ef4444' },
    { name: 'Accounts', growth: s.accounts.growth, fill: '#f59e0b' },
    { name: 'IB Partners', growth: s.ibPartners.growth, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-5 pb-6">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 18%, var(--theme-bg-card)) 0%, var(--theme-bg-card) 60%)',
          border: '1px solid var(--theme-border)',
        }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-5 -translate-y-24 translate-x-24"
          style={{ background: 'var(--theme-primary)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-3 translate-y-16"
          style={{ background: 'var(--theme-primary)' }} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: isOnline ? '#10b98118' : '#ef444418',
                  border: `1px solid ${isOnline ? '#10b98140' : '#ef444440'}`,
                  color: isOnline ? '#10b981' : '#ef4444',
                }}>
                {isOnline
                  ? <><Wifi className="w-3 h-3" /> Live Data</>
                  : <><WifiOff className="w-3 h-3" /> Offline</>
                }
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: 'var(--theme-text-primary)' }}>
              Admin Dashboard
            </h1>
            <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
              <Activity className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
              Real-time business insights
              {lastUpdated && (
                <span className="ml-2 text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>
                  · Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick stat pills */}
            <div className="hidden lg:flex items-center gap-2">
              {[
                { label: 'Net Revenue', value: fmtCurrency(s.deposits.total - s.withdrawals.total), color: '#10b981' },
                { label: "Today's Deps", value: fmtCurrency(s.deposits.today), color: '#6366f1' },
              ].map(pill => (
                <div key={pill.label} className="flex flex-col px-3 py-1.5 rounded-xl"
                  style={{ background: `${pill.color}12`, border: `1px solid ${pill.color}30` }}>
                  <span className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>{pill.label}</span>
                  <span className="text-sm font-bold" style={{ color: pill.color }}>{pill.value}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))' }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && dashboardData && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {dashboardData && (
        <>
          {/* ── Metric Cards with Sparklines ────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              {
                label: 'Total Clients', value: s.clients.total.toLocaleString(), icon: Users, accent: '#6366f1',
                sub: `+${s.clients.today} today`, growth: s.clients.growth,
                badge: s.clients.pending > 0 ? { label: `${s.clients.pending} pending`, color: '#f59e0b' } : undefined,
                onClick: () => navigate('/admin/features/clients'),
                sparkData: sparkClients, sparkKey: 'v',
              },
              {
                label: 'Total Deposits', value: fmtCurrency(s.deposits.total), icon: ArrowDownCircle, accent: '#10b981',
                sub: `${s.deposits.count} transactions`, growth: s.deposits.growth,
                badge: s.deposits.pending > 0 ? { label: `${s.deposits.pending} pending`, color: '#10b981' } : undefined,
                onClick: () => navigate('/admin/features/deposits'),
                sparkData: sparkDeposits, sparkKey: 'v',
              },
              {
                label: 'Total Withdrawals', value: fmtCurrency(s.withdrawals.total), icon: ArrowUpCircle, accent: '#ef4444',
                sub: `${s.withdrawals.count} requests`, growth: s.withdrawals.growth,
                badge: s.withdrawals.pending > 0 ? { label: `${s.withdrawals.pending} pending`, color: '#ef4444' } : undefined,
                onClick: () => navigate('/admin/features/withdrawals'),
                sparkData: sparkWithdrawals, sparkKey: 'v',
              },
              {
                label: 'Transactions', value: s.transactions.total.toLocaleString(), icon: BarChart3, accent: '#06b6d4',
                sub: 'Total volume', growth: s.transactions.growth,
                onClick: () => navigate('/admin/features/transactions'),
                sparkData: sparkTxn, sparkKey: 'v',
              },
              {
                label: 'IB Partners', value: s.ibPartners.total.toLocaleString(), icon: UserCheck, accent: '#8b5cf6',
                sub: 'Active partners', growth: s.ibPartners.growth,
                badge: s.ibPartners.pending > 0 ? { label: `${s.ibPartners.pending} pending`, color: '#8b5cf6' } : undefined,
                onClick: () => navigate('/admin/partner/ib-partners'),
              },
              {
                label: 'Trading Accounts', value: s.accounts.total.toLocaleString(), icon: CreditCard, accent: '#f59e0b',
                sub: `+${s.accounts.today} today`, growth: s.accounts.growth,
              },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <MetricCard {...card} />
              </motion.div>
            ))}
          </div>

          {/* ── Revenue Analytics + Pending Actions ─────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <RevenueChart data={dashboardData.revenueData} />
            </div>
            <SectionCard title="Pending Actions" subtitle="Requires your attention" icon={Clock}>
              <PendingActions data={pendingData} />
            </SectionCard>
          </div>

          {/* ── Account Distribution + Growth Rate ──────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ClientDistributionChart data={dashboardData.clientDistribution} />
            <SectionCard title="Growth Rate" subtitle="% change vs previous period" icon={TrendingUp}>
              <GrowthRateChart data={growthData} />
            </SectionCard>
          </div>

          {/* ── Summary Quick Stats ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Today's Deposits", value: fmtFull(s.deposits.today), icon: ArrowDownCircle, color: '#10b981' },
              { label: 'New Clients Today', value: s.clients.today.toString(), icon: Users, color: '#6366f1' },
              { label: 'New Accounts Today', value: s.accounts.today.toString(), icon: CreditCard, color: '#f59e0b' },
              {
                label: 'Net Revenue', icon: DollarSign,
                value: fmtFull(s.deposits.total - s.withdrawals.total),
                color: (s.deposits.total - s.withdrawals.total) >= 0 ? '#10b981' : '#ef4444'
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}30` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg p-1.5" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Quick Navigation ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Manage Clients', icon: Users, color: '#6366f1', path: '/admin/features/clients' },
              { label: 'View Deposits', icon: ArrowDownCircle, color: '#10b981', path: '/admin/features/deposits' },
              { label: 'View Withdrawals', icon: ArrowUpCircle, color: '#ef4444', path: '/admin/features/withdrawals' },
              { label: 'All Transactions', icon: BarChart3, color: '#06b6d4', path: '/admin/features/transactions' },
            ].map(item => (
              <motion.button
                key={item.label}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}30`, cursor: 'pointer' }}
              >
                <div className="rounded-xl p-2 flex-shrink-0" style={{ background: `${item.color}20` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: item.color }} />
              </motion.button>
            ))}
          </div>

          {/* ── Recent Transactions + Top Clients ───────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <RecentTransactions transactions={dashboardData.recentTransactions} />
            <TopPerformingClients clients={dashboardData.topClients} />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
