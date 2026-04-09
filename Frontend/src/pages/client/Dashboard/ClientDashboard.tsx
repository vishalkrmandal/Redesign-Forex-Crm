// Frontend/src/pages/client/Dashboard/ClientDashboard.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw, Plus, TrendingUp, TrendingDown, Wallet, Activity,
  DollarSign, ArrowDownCircle, ArrowUpCircle, CreditCard,
  ArrowRight, CheckCircle, XCircle, Clock, AlertCircle, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi } from './dashboardApi';
import MarketChartWidget from './components/MarketChartWidget';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const fmtCurrency = (val: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
    typeof val === 'string' ? parseFloat(val) || 0 : val
  );

const fmtCompact = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val);

const TX_STATUS: Record<string, { color: string; Icon: React.ElementType }> = {
  Approved:   { color: '#10b981', Icon: CheckCircle },
  Pending:    { color: '#f59e0b', Icon: Clock },
  Processing: { color: '#6366f1', Icon: Activity },
  Rejected:   { color: '#ef4444', Icon: XCircle },
};

const TX_TYPE_COLOR: Record<string, string> = {
  deposit: '#10b981', withdrawal: '#ef4444', transfer: '#6366f1',
};

interface DashboardData {
  overview: {
    totalBalance: string; totalEquity: string;
    totalDeposits: string; totalWithdrawals: string;
    totalMt5Accounts: number; netBalance: string;
  };
  recentTransactions: any[];
  activeAccounts: any[];
}

// ─── Section header with left accent bar ─────────────────────────────────────
const SectionHead = ({
  label, sub, accentColor, right,
}: { label: string; sub?: string; accentColor: string; right?: React.ReactNode }) => (
  <div style={{
    padding: '12px 16px',
    borderBottom: '1px solid var(--theme-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--theme-bg-card)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        display: 'inline-block', width: 4, height: 22, borderRadius: 2,
        background: accentColor, flexShrink: 0,
      }} />
      <div>
        <p style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
          fontWeight: 700, color: 'var(--theme-text-muted)', margin: 0,
        }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'var(--theme-text-disabled)', margin: 0, marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
    {right}
  </div>
);

const ViewAllBtn = ({ label, path, color, onClick }: { label?: string; path?: string; color: string; onClick?: () => void }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick ?? (() => path && navigate(path))}
      style={{
        fontSize: 11, color, fontWeight: 600, background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
      }}
    >
      {label ?? 'View all'} <ArrowRight style={{ width: 11, height: 11 }} />
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ClientDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [overviewData, setOverviewData] = useState<DashboardData['overview'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [hoveredTxRow, setHoveredTxRow] = useState<string | null>(null);
  const [hoveredAccRow, setHoveredAccRow] = useState<string | null>(null);
  const navigate = useNavigate();

  const intervalRef   = useRef<NodeJS.Timeout | null>(null);
  const countdownRef  = useRef<NodeJS.Timeout | null>(null);

  const overview = overviewData ?? dashboardData?.overview;

  // ── Derived data ────────────────────────────────────────────────────────────

  // Account distribution grouped by accountType (not by account number)
  const accountTypeData = useMemo(() => {
    if (!dashboardData?.activeAccounts?.length) return [];
    const map: Record<string, { count: number; balance: number }> = {};
    dashboardData.activeAccounts.forEach((a: any) => {
      const t = a.accountType || 'Standard';
      if (!map[t]) map[t] = { count: 0, balance: 0 };
      map[t].count++;
      map[t].balance += parseFloat(a.balance) || 0;
    });
    const total = Object.values(map).reduce((s, v) => s + v.balance, 0) || 1;
    return Object.entries(map).map(([name, d], i) => ({
      name,
      value: d.balance,
      count: d.count,
      pct: Math.round((d.balance / total) * 100),
      fill: COLORS[i % COLORS.length],
    }));
  }, [dashboardData?.activeAccounts]);

  // Financial flow: Deposits, Withdrawals, Net = deposits - withdrawals
  const financialFlow = useMemo(() => {
    if (!overview) return [];
    const deps  = parseFloat(overview.totalDeposits)    || 0;
    const withs = parseFloat(overview.totalWithdrawals) || 0;
    const net   = deps - withs;
    const max   = Math.max(deps, 1);
    return [
      { label: 'Total Deposits',  value: deps,  pct: 100,                                      color: '#10b981' },
      { label: 'Total Withdrawn', value: withs, pct: Math.round((withs / max) * 100),           color: '#ef4444' },
      { label: 'Net Cash',        value: net,   pct: Math.round((Math.max(net, 0) / max) * 100), color: '#6366f1' },
    ];
  }, [overview]);

  // Activity breakdown — lowercase type comparison (backend sends 'deposit', not 'Deposit')
  const activityCounts = useMemo(() => {
    if (!dashboardData?.recentTransactions?.length) return null;
    const counts:  Record<string, number> = { deposit: 0, withdrawal: 0, transfer: 0 };
    const amounts: Record<string, number> = { deposit: 0, withdrawal: 0, transfer: 0 };
    dashboardData.recentTransactions.forEach((tx: any) => {
      const t = (tx.type || '').toLowerCase();
      if (t in counts) { counts[t]++; amounts[t] += parseFloat(tx.amount) || 0; }
    });
    return { counts, amounts };
  }, [dashboardData?.recentTransactions]);

  // Portfolio health — correct financial metrics
  const portfolio = useMemo(() => {
    if (!overview) return null;
    const balance   = parseFloat(overview.totalBalance)     || 0;
    const equity    = parseFloat(overview.totalEquity)      || 0;
    const deps      = parseFloat(overview.totalDeposits)    || 0;
    const withs     = parseFloat(overview.totalWithdrawals) || 0;
    const netCash   = deps - withs;                         // net funds invested
    const floating  = equity - balance;                     // unrealized P&L
    const roi       = netCash > 0 ? ((balance - netCash) / netCash) * 100 : 0;
    return { balance, equity, netCash, floating, roi };
  }, [overview]);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchDashboardData = async (showLoader = false, isAuto = false) => {
    if (isRequestInProgress && isAuto) return;
    try {
      setIsRequestInProgress(true);
      if (showLoader) setRefreshing(true);
      else if (!isAuto) setLoading(true);
      const [overviewRes, txRes, accountsRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getRecentTransactions(),
        dashboardApi.getActiveAccounts(),
      ]);
      setDashboardData({
        overview:           overviewRes.data,
        recentTransactions: txRes.data.transactions,
        activeAccounts:     accountsRes.data.accounts,
      });
      setOverviewData(overviewRes.data);
      setLastRefresh(new Date());
      setCountdown(5);
      if (showLoader && !isAuto) toast.success('Dashboard refreshed');
    } catch {
      if (!isAuto) toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRequestInProgress(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    intervalRef.current  = setInterval(() => { if (!isRequestInProgress) fetchDashboardData(false, true); }, 5000);
    countdownRef.current = setInterval(() => setCountdown(p => p <= 1 ? 5 : p - 1), 1000);
    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleManualRefresh = () => {
    [intervalRef, countdownRef].forEach(r => { if (r.current) clearInterval(r.current); });
    fetchDashboardData(true, false);
    intervalRef.current  = setInterval(() => { if (!isRequestInProgress) fetchDashboardData(false, true); }, 5000);
    countdownRef.current = setInterval(() => setCountdown(p => p <= 1 ? 5 : p - 1), 1000);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading && !dashboardData) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl" style={{ background: 'var(--theme-border)' }} />
        <div className="h-20 rounded-xl"  style={{ background: 'var(--theme-border)' }} />
        <div className="h-72 rounded-xl"  style={{ background: 'var(--theme-border)' }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => <div key={i} className="h-56 rounded-xl" style={{ background: 'var(--theme-border)' }} />)}
        </div>
      </div>
    );
  }

  const recentTx  = (dashboardData?.recentTransactions || []).slice(0, 8);
  const activeAcs = (dashboardData?.activeAccounts     || []).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

      {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: 16, border: '1px solid var(--theme-border)',
          padding: '20px 24px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.05) 60%, transparent 100%)',
        }}
      >
        {/* decorative orbs */}
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12), transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-20, left:'35%', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.08), transparent)', pointerEvents:'none' }} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'#10b981', fontWeight:700 }}>
                Live Dashboard
              </span>
              {lastRefresh && (
                <span style={{ fontSize:10, color:'var(--theme-text-disabled)' }}>
                  · Updated {lastRefresh.toLocaleTimeString('en-US', { hour12:true, hour:'numeric', minute:'2-digit' })}
                </span>
              )}
            </div>
            <h1 style={{ fontSize:28, fontWeight:900, color:'var(--theme-text-primary)', lineHeight:1.1, margin:0 }}>
              Trading Dashboard
            </h1>
            <p style={{ fontSize:13, color:'var(--theme-text-muted)', marginTop:4 }}>
              Monitor your portfolio performance in real-time
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              fontSize:11, color:'var(--theme-text-disabled)',
              background:'rgba(0,0,0,0.06)', borderRadius:8, padding:'4px 10px',
              border:'1px solid var(--theme-border)',
            }}>
              Auto-refresh in {countdown}s
            </div>
            <button
              onClick={() => navigate('/client/account/new')}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                borderRadius:10, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg, #10b981, #059669)',
                color:'white', fontSize:13, fontWeight:600,
              }}
            >
              <Plus style={{ width:14, height:14 }} />
              <span className="hidden sm:inline">New Account</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                borderRadius:10, cursor:'pointer',
                background:'rgba(99,102,241,0.12)', color:'#6366f1',
                fontSize:13, fontWeight:600,
                border:'1px solid rgba(99,102,241,0.25)',
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              <RefreshCw style={{ width:14, height:14 }} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ══ METRICS STRIP ════════════════════════════════════════════════════ */}
      {overview && (
        <motion.div
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          {[
            { label:'Total Balance',  value:fmtCurrency(overview.totalBalance),     sub:'All accounts combined', color:'#6366f1', Icon:Wallet },
            { label:'Total Equity',   value:fmtCurrency(overview.totalEquity),      sub:'Current equity value',  color:'#10b981', Icon:TrendingUp },
            { label:'Total Deposits', value:fmtCurrency(overview.totalDeposits),    sub:'Lifetime funded',       color:'#f59e0b', Icon:ArrowDownCircle },
            { label:'Withdrawals',    value:fmtCurrency(overview.totalWithdrawals), sub:'Total withdrawn',       color:'#ef4444', Icon:ArrowUpCircle },
            { label:'MT5 Accounts',   value:String(overview.totalMt5Accounts),      sub:'Active accounts',       color:'#8b5cf6', Icon:CreditCard },
          ].map((m, i, arr) => (
            <div key={m.label} style={{
              padding:'16px 18px',
              borderRight: i < arr.length - 1 ? '1px solid var(--theme-border)' : 'none',
              borderBottom: '3px solid transparent',
              borderTop: `3px solid ${m.color}`,
              background:'var(--theme-bg-card)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, color:'var(--theme-text-muted)' }}>
                  {m.label}
                </span>
                <m.Icon style={{ width:13, height:13, color:m.color, opacity:0.6 }} />
              </div>
              <p style={{ fontSize:20, fontWeight:800, color:'var(--theme-text-primary)', lineHeight:1, margin:0 }}>{m.value}</p>
              <p style={{ fontSize:10, color:'var(--theme-text-disabled)', marginTop:4 }}>{m.sub}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ══ LIVE MARKET CHART ════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <MarketChartWidget />
      </motion.div>

      {/* ══ ACCOUNT DISTRIBUTION + FINANCIAL SUMMARY ════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-4">

        {/* Account Distribution by TYPE */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          <SectionHead
            label="Account Distribution"
            sub="Balance by account type"
            accentColor="linear-gradient(180deg,#6366f1,#8b5cf6)"
          />
          <div style={{ padding:16, background:'var(--theme-bg-card)' }}>
            {accountTypeData.length > 0 ? (
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                {/* Mini donut */}
                <div style={{ width:96, height:96, flexShrink:0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountTypeData} cx="50%" cy="50%"
                        innerRadius={28} outerRadius={44}
                        paddingAngle={4} dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        {accountTypeData.map((_, i) => (
                          <Cell key={i} fill={accountTypeData[i].fill} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }: any) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{
                              background:'var(--theme-bg-card)', border:'1px solid var(--theme-border)',
                              borderRadius:8, padding:'6px 10px', fontSize:11, boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
                            }}>
                              <p style={{ fontWeight:700, color:'var(--theme-text-primary)', marginBottom:2 }}>{d.name}</p>
                              <p style={{ color:'var(--theme-text-muted)' }}>{fmtCurrency(d.value)}</p>
                              <p style={{ color:d.fill, fontWeight:600 }}>{d.pct}% · {d.count} acct{d.count !== 1 ? 's' : ''}</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Type list with progress bars */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                  {accountTypeData.map(t => (
                    <div key={t.name}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:t.fill, display:'inline-block', flexShrink:0 }} />
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--theme-text-primary)' }}>{t.name}</span>
                          <span style={{
                            fontSize:10, color:'var(--theme-text-muted)',
                            background:'var(--theme-border)', borderRadius:4, padding:'1px 5px',
                          }}>{t.count} acct{t.count !== 1 ? 's' : ''}</span>
                        </div>
                        <span style={{ fontSize:13, fontWeight:800, color:t.fill }}>{t.pct}%</span>
                      </div>
                      <div style={{ height:5, background:'var(--theme-border)', borderRadius:3 }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${t.pct}%` }}
                          transition={{ duration:0.7, ease:'easeOut' }}
                          style={{ height:'100%', background:t.fill, borderRadius:3 }}
                        />
                      </div>
                      <p style={{ fontSize:10, color:'var(--theme-text-disabled)', marginTop:3 }}>
                        {fmtCompact(t.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--theme-text-disabled)', fontSize:13 }}>
                No account data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Financial Summary + Activity Breakdown */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          <SectionHead
            label="Financial Summary"
            sub="Deposits · Withdrawals · Net cash flow"
            accentColor="linear-gradient(180deg,#10b981,#059669)"
          />
          <div style={{ padding:16, background:'var(--theme-bg-card)' }}>
            {/* Horizontal flow bars */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {financialFlow.map(f => (
                <div key={f.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:f.color, display:'inline-block', flexShrink:0 }} />
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--theme-text-primary)' }}>{f.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:f.color }}>{fmtCompact(f.value)}</span>
                      <span style={{
                        fontSize:10, fontWeight:600, color:f.color,
                        background:`${f.color}12`, borderRadius:5, padding:'2px 7px',
                        border:`1px solid ${f.color}25`,
                      }}>{f.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:6, background:'var(--theme-border)', borderRadius:3 }}>
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${f.pct}%` }}
                      transition={{ duration:0.8, ease:'easeOut', delay:0.1 }}
                      style={{ height:'100%', background:f.color, borderRadius:3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Net Balance formula note */}
            <p style={{ fontSize:10, color:'var(--theme-text-disabled)', marginTop:10, paddingTop:10, borderTop:'1px solid var(--theme-border)' }}>
              Net Cash = Total Deposits − Total Withdrawals
            </p>

            {/* Activity Breakdown */}
            <div style={{ marginTop:14 }}>
              <p style={{
                fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em',
                fontWeight:700, color:'var(--theme-text-muted)', marginBottom:10,
              }}>Activity Breakdown</p>

              {activityCounts && (activityCounts.counts.deposit + activityCounts.counts.withdrawal + activityCounts.counts.transfer > 0) ? (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {([
                    { key:'deposit',    label:'Deposits',    color:'#10b981' },
                    { key:'withdrawal', label:'Withdrawals', color:'#ef4444' },
                    { key:'transfer',   label:'Transfers',   color:'#6366f1' },
                  ] as const).filter(t => activityCounts.counts[t.key] > 0).map(t => (
                    <div key={t.key} style={{
                      display:'flex', alignItems:'center', gap:8,
                      background:`${t.color}0e`, border:`1px solid ${t.color}20`,
                      borderRadius:10, padding:'8px 12px',
                    }}>
                      <span style={{ fontSize:22, fontWeight:900, color:t.color, lineHeight:1 }}>
                        {activityCounts.counts[t.key]}
                      </span>
                      <div>
                        <p style={{ fontSize:12, fontWeight:600, color:'var(--theme-text-primary)', margin:0 }}>{t.label}</p>
                        <p style={{ fontSize:10, color:'var(--theme-text-muted)', margin:0 }}>
                          {fmtCompact(activityCounts.amounts[t.key])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:12, color:'var(--theme-text-disabled)' }}>No transaction activity yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══ PORTFOLIO HEALTH ══════════════════════════════════════════════════ */}
      {portfolio && (
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          <SectionHead
            label="Portfolio Health"
            sub="Real-time financial metrics"
            accentColor="linear-gradient(180deg,#f59e0b,#d97706)"
          />
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            style={{ background:'var(--theme-bg-card)' }}
          >
            {[
              {
                label: 'Net Cash Invested',
                value: fmtCurrency(portfolio.netCash),
                sub:   'Deposits − Withdrawals',
                color: '#6366f1',
                Icon:  DollarSign,
              },
              {
                label: 'Total Balance',
                value: fmtCurrency(portfolio.balance),
                sub:   'Current account balance',
                color: '#10b981',
                Icon:  Wallet,
              },
              {
                label: 'Total Equity',
                value: fmtCurrency(portfolio.equity),
                sub:   'Balance + open P&L',
                color: '#06b6d4',
                Icon:  Layers,
              },
              {
                label: 'Floating P&L',
                value: (portfolio.floating >= 0 ? '+' : '') + fmtCurrency(portfolio.floating),
                sub:   'Equity − Balance',
                color: portfolio.floating >= 0 ? '#10b981' : '#ef4444',
                Icon:  portfolio.floating >= 0 ? TrendingUp : TrendingDown,
              },
              {
                label: 'ROI',
                value: (portfolio.roi >= 0 ? '+' : '') + portfolio.roi.toFixed(2) + '%',
                sub:   'vs. net cash invested',
                color: portfolio.roi >= 0 ? '#10b981' : '#ef4444',
                Icon:  portfolio.roi >= 0 ? TrendingUp : TrendingDown,
              },
            ].map((m, i, arr) => (
              <div key={m.label} style={{
                padding:'16px 18px',
                borderRight: i < arr.length - 1 ? '1px solid var(--theme-border)' : 'none',
                borderTop:`2px solid ${m.color}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, color:'var(--theme-text-muted)' }}>
                    {m.label}
                  </span>
                  <m.Icon style={{ width:12, height:12, color:m.color, opacity:0.6 }} />
                </div>
                <p style={{ fontSize:18, fontWeight:800, color:m.color, margin:0, lineHeight:1 }}>{m.value}</p>
                <p style={{ fontSize:10, color:'var(--theme-text-disabled)', marginTop:4 }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══ QUICK ACTIONS ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {([
          { label:'Deposit Funds',  desc:'Add funds to account',    path:'/client/financial/deposit',    color:'#10b981', Icon:ArrowDownCircle },
          { label:'Withdraw',       desc:'Withdraw your earnings',  path:'/client/financial/withdrawal', color:'#ef4444', Icon:ArrowUpCircle },
          { label:'Transfer',       desc:'Move between accounts',   path:'/client/financial/transfer',   color:'#6366f1', Icon:Activity },
          { label:'New Account',    desc:'Open a new MT5 account',  path:'/client/account/new',          color:'#f59e0b', Icon:Plus },
        ] as const).map(a => (
          <motion.button
            key={a.label}
            whileHover={{ y:-2 }}
            whileTap={{ scale:0.98 }}
            onClick={() => navigate(a.path)}
            style={{
              display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
              borderRadius:10, border:`1px solid ${a.color}22`,
              background:`${a.color}08`, cursor:'pointer', textAlign:'left',
            }}
          >
            <div style={{
              width:36, height:36, borderRadius:8, flexShrink:0,
              background:`${a.color}15`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <a.Icon style={{ width:16, height:16, color:a.color }} />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--theme-text-primary)', margin:0 }}>{a.label}</p>
              <p style={{ fontSize:11, color:'var(--theme-text-muted)', margin:0 }}>{a.desc}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* ══ RECENT TRANSACTIONS + ACTIVE ACCOUNTS ════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          <SectionHead
            label="Recent Transactions"
            accentColor="linear-gradient(180deg,#6366f1,#ec4899)"
            right={<ViewAllBtn path="/client/financial/transactions" color="#6366f1" />}
          />
          <div style={{ background:'var(--theme-bg-card)' }}>
            {recentTx.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--theme-border)' }}>
                    {['Type','Amount','Status','Date'].map(h => (
                      <th key={h} style={{
                        padding:'8px 12px', fontSize:10, fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.06em',
                        color:'var(--theme-text-disabled)', textAlign:'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {recentTx.map((tx: any, i: number) => {
                      const typeKey = (tx.type || '').toLowerCase();
                      const typeColor = TX_TYPE_COLOR[typeKey] || '#94a3b8';
                      const typeLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1) || 'Unknown';
                      const statusCfg = TX_STATUS[tx.status] || { color:'#94a3b8', Icon:AlertCircle };
                      const StatusIcon = statusCfg.Icon;
                      const isHov = hoveredTxRow === (tx.id || i);
                      return (
                        <motion.tr
                          key={tx.id || i}
                          initial={{ opacity:0 }}
                          animate={{ opacity:1 }}
                          exit={{ opacity:0 }}
                          onMouseEnter={() => setHoveredTxRow(tx.id || i)}
                          onMouseLeave={() => setHoveredTxRow(null)}
                          style={{
                            borderBottom: i < recentTx.length - 1 ? '1px solid var(--theme-border)' : 'none',
                            background: isHov ? 'rgba(99,102,241,0.04)' : 'transparent',
                            transition:'background 0.15s',
                          }}
                        >
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{
                              display:'inline-block', fontSize:11, fontWeight:700, color:typeColor,
                              background:`${typeColor}12`, borderRadius:5, padding:'2px 8px',
                              border:`1px solid ${typeColor}25`,
                            }}>{typeLabel}</span>
                          </td>
                          <td style={{ padding:'9px 12px', fontSize:13, fontWeight:700, color:'var(--theme-text-primary)' }}>
                            {fmtCurrency(tx.amount)}
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <StatusIcon style={{ width:12, height:12, color:statusCfg.color }} />
                              <span style={{ fontSize:11, fontWeight:600, color:statusCfg.color }}>{tx.status}</span>
                            </div>
                          </td>
                          <td style={{ padding:'9px 12px', fontSize:11, color:'var(--theme-text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'36px 16px', textAlign:'center', color:'var(--theme-text-disabled)', fontSize:13 }}>
                No transactions yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Accounts */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ borderRadius:12, border:'1px solid var(--theme-border)', overflow:'hidden' }}
        >
          <SectionHead
            label="Active Accounts"
            accentColor="linear-gradient(180deg,#10b981,#06b6d4)"
            right={<ViewAllBtn path="/client/account/list" color="#10b981" />}
          />
          <div style={{ background:'var(--theme-bg-card)' }}>
            {activeAcs.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--theme-border)' }}>
                    {['Account','Type','Balance','Status'].map(h => (
                      <th key={h} style={{
                        padding:'8px 12px', fontSize:10, fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.06em',
                        color:'var(--theme-text-disabled)', textAlign:'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {activeAcs.map((acc: any, i: number) => {
                      const isHov = hoveredAccRow === (acc.id || i);
                      return (
                        <motion.tr
                          key={acc.id || i}
                          initial={{ opacity:0 }}
                          animate={{ opacity:1 }}
                          exit={{ opacity:0 }}
                          onMouseEnter={() => setHoveredAccRow(acc.id || i)}
                          onMouseLeave={() => setHoveredAccRow(null)}
                          style={{
                            borderBottom: i < activeAcs.length - 1 ? '1px solid var(--theme-border)' : 'none',
                            background: isHov ? 'rgba(16,185,129,0.04)' : 'transparent',
                            transition:'background 0.15s',
                          }}
                        >
                          <td style={{ padding:'9px 12px' }}>
                            <p style={{ fontSize:12, fontWeight:700, color:'var(--theme-text-primary)', margin:0 }}>{acc.mt5Account}</p>
                            <p style={{ fontSize:10, color:'var(--theme-text-muted)', margin:0 }}>1:{acc.leverage}</p>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{
                              fontSize:11, fontWeight:600, color:'#6366f1',
                              background:'rgba(99,102,241,0.1)', borderRadius:5, padding:'2px 7px',
                            }}>{acc.accountType}</span>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <p style={{ fontSize:13, fontWeight:700, color:'var(--theme-text-primary)', margin:0 }}>{fmtCurrency(acc.balance)}</p>
                            <p style={{ fontSize:10, color:'var(--theme-text-muted)', margin:0 }}>Eq: {fmtCurrency(acc.equity)}</p>
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <span style={{
                                width:6, height:6, borderRadius:'50%',
                                background: acc.status ? '#10b981' : '#ef4444',
                                display:'inline-block',
                              }} />
                              <span style={{ fontSize:11, fontWeight:600, color: acc.status ? '#10b981' : '#ef4444' }}>
                                {acc.status ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'36px 16px', textAlign:'center', color:'var(--theme-text-disabled)', fontSize:13 }}>
                No active accounts
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDashboard;
