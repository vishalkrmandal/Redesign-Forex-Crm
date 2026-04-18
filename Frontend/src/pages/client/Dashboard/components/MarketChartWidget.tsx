// Frontend/src/pages/client/Dashboard/components/MarketChartWidget.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Area, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, ChevronDown,
  Activity, Zap, BarChart2, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

interface ChartPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  label?: string;
}

interface MarketData {
  symbol: string;
  currentPrice: number;
  previousClose: number | null;
  change: number;
  changePct: number;
  currency: string;
  interval: string;
  data: ChartPoint[];
}

interface SymbolOption {
  symbol: string;
  name: string;
  category: string;
}

const INTERVALS = [
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

const fmt = (v: number, decimals = 5) =>
  v != null ? v.toFixed(decimals) : '—';

const fmtTime = (isoStr: string, interval: string) => {
  const d = new Date(isoStr);
  if (['1d', '1w', '1M'].includes(interval)) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const CustomTooltip = ({ active, payload, interval }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl p-3 shadow-2xl text-xs border backdrop-blur-md"
      style={{ background: 'rgba(15,20,40,0.95)', borderColor: 'rgba(99,102,241,0.4)', minWidth: 160 }}>
      <p className="font-semibold mb-2 text-slate-200">{fmtTime(d.time, interval)}</p>
      <div className="space-y-1">
        {[
          { label: 'Open', val: d.open, color: '#94a3b8' },
          { label: 'High', val: d.high, color: '#10b981' },
          { label: 'Low', val: d.low, color: '#ef4444' },
          { label: 'Close', val: d.close, color: '#6366f1' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span style={{ color: r.color }}>{r.label}</span>
            <span className="font-mono font-bold text-white">{fmt(r.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketChartWidget: React.FC = () => {
  const [symbols, setSymbols] = useState<SymbolOption[]>([]);
  const [openTradeSymbols, setOpenTradeSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbolDropOpen, setSymbolDropOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setSymbolDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch default symbols list
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const res = await axios.get(`${API_BASE_URL}/api/market/symbols`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setSymbols(res.data.symbols);
      } catch { /* silent */ }
    };
    fetchSymbols();
  }, []);

  // Fetch open trade symbols — fall back to popular default (EURUSD) if none
  useEffect(() => {
    const fetchOpenTrades = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const res = await axios.get(`${API_BASE_URL}/api/trading/open`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.trades?.length) {
          const syms: string[] = [...new Set(
            res.data.trades
              .map((t: any) => t.symbol?.replace(/[m.]$/i, '').toUpperCase())
              .filter(Boolean)
          )] as string[];
          setOpenTradeSymbols(syms);
          // Auto-select first active trade symbol
          setSelectedSymbol(syms[0]);
        } else {
          // No active trades — default to most popular symbol
          setSelectedSymbol('EURUSD');
        }
      } catch {
        // On error fall back to EURUSD
        setSelectedSymbol('EURUSD');
      }
    };
    fetchOpenTrades();
  }, []);

  const fetchMarketData = useCallback(async (sym: string, interval: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      const res = await axios.get(`${API_BASE_URL}/api/market/chart`, {
        params: { symbol: sym, interval },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      if (res.data.success) {
        const md: MarketData = res.data;
        // Flash price color
        if (prevPriceRef.current !== null) {
          setPriceFlash(md.currentPrice > prevPriceRef.current ? 'up' : 'down');
          setTimeout(() => setPriceFlash(null), 800);
        }
        prevPriceRef.current = md.currentPrice;
        setMarketData(md);
        // Prepare chart data with formatted labels
        const formatted = md.data.map(d => ({
          ...d,
          label: fmtTime(d.time, interval),
        }));
        setChartData(formatted);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMarketData(selectedSymbol, selectedInterval);
    const interval = setInterval(() => {
      fetchMarketData(selectedSymbol, selectedInterval);
    }, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [selectedSymbol, selectedInterval, fetchMarketData]);

  const isPositive = (marketData?.change ?? 0) >= 0;
  const allSymbolsList = [
    ...openTradeSymbols.map(s => ({ symbol: s, name: s, category: 'Active Trade' })),
    ...symbols.filter(s => !openTradeSymbols.includes(s.symbol)),
  ];

  // Gradient color based on trend
  const gradientColor = isPositive ? '#10b981' : '#ef4444';
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  // Determine y-axis domain
  const prices = chartData.map(d => d.close).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) * 0.9998 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 1.0002 : 1;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Activity className="w-5 h-5" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Live Market Chart
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              Real-time price data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Interval Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'var(--theme-border)', gap: '2px' }}>
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => setSelectedInterval(iv.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200"
                style={{
                  background: selectedInterval === iv.value ? '#6366f1' : 'transparent',
                  color: selectedInterval === iv.value ? 'white' : 'var(--theme-text-muted)',
                }}
              >
                {iv.label}
              </button>
            ))}
          </div>

          {/* Symbol Dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setSymbolDropOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-80"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#6366f1',
              }}
            >
              <Zap className="w-3 h-3" />
              {selectedSymbol}
              <ChevronDown className={`w-3 h-3 transition-transform ${symbolDropOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {symbolDropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'var(--theme-bg-card)',
                    border: '1px solid var(--theme-border)',
                    minWidth: 200,
                    maxHeight: 300,
                    overflowY: 'auto',
                  }}
                >
                  {openTradeSymbols.length > 0 && (
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: '#10b981', borderBottom: '1px solid var(--theme-border)' }}>
                      Active Trades
                    </div>
                  )}
                  {allSymbolsList.map((s, idx) => (
                    <React.Fragment key={s.symbol}>
                      {idx === openTradeSymbols.length && openTradeSymbols.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--theme-text-muted)', borderBottom: '1px solid var(--theme-border)', borderTop: '1px solid var(--theme-border)' }}>
                          All Symbols
                        </div>
                      )}
                      <button
                        onClick={() => { setSelectedSymbol(s.symbol); setSymbolDropOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-all duration-150 hover:bg-white/5"
                        style={{ color: s.symbol === selectedSymbol ? '#6366f1' : 'var(--theme-text-primary)' }}
                      >
                        <span className="font-semibold">{s.symbol}</span>
                        {s.category === 'Active Trade' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            LIVE
                          </span>
                        )}
                      </button>
                    </React.Fragment>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchMarketData(selectedSymbol, selectedInterval)}
            disabled={loading}
            className="p-1.5 rounded-xl transition-all duration-200 hover:opacity-70"
            style={{ background: 'var(--theme-border)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              style={{ color: 'var(--theme-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* ── Price Display ──────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex items-end justify-between">
        <div className="flex items-end gap-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={marketData?.currentPrice}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-black font-mono tracking-tight"
              style={{
                color: priceFlash === 'up' ? '#10b981' : priceFlash === 'down' ? '#ef4444' : 'var(--theme-text-primary)',
                transition: 'color 0.3s',
              }}
            >
              {marketData ? fmt(marketData.currentPrice, 5) : '—'}
            </motion.span>
          </AnimatePresence>

          {marketData && (
            <div className={`flex items-center gap-1 mb-0.5 text-sm font-semibold`}
              style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{fmt(marketData.change, 5)}</span>
              <span className="text-xs opacity-80">
                ({isPositive ? '+' : ''}{marketData.changePct.toFixed(3)}%)
              </span>
            </div>
          )}
        </div>

        {marketData && (
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
              <Clock className="w-3 h-3" />
              <span>Live • 10s refresh</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-disabled)' }}>
              {marketData.symbol} · {marketData.currency}
            </p>
          </div>
        )}
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────── */}
      <div className="px-1 pb-3" style={{ height: 280 }}>
        {loading && !chartData.length ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Loading market data…
              </p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30"
                style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                No chart data available
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor} stopOpacity={0.25} />
                  <stop offset="60%" stopColor={gradientColor} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={gradientColor} stopOpacity={0.7} />
                  <stop offset="50%" stopColor={gradientColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'var(--theme-text-disabled)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickCount={6}
              />

              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 9, fill: 'var(--theme-text-disabled)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v.toFixed(4)}
                width={56}
              />

              <Tooltip content={<CustomTooltip interval={selectedInterval} />} />

              {/* Previous close reference line */}
              {marketData?.previousClose && (
                <ReferenceLine
                  y={marketData.previousClose}
                  stroke="rgba(148,163,184,0.4)"
                  strokeDasharray="4 4"
                  label={{ value: 'Prev Close', position: 'insideTopRight', fontSize: 8, fill: 'rgba(148,163,184,0.6)' }}
                />
              )}

              {/* Area fill */}
              <Area
                type="monotone"
                dataKey="close"
                fill="url(#marketGradient)"
                stroke="none"
                isAnimationActive={false}
              />

              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={`url(#lineGradient)`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: 'white', strokeWidth: 2 }}
                isAnimationActive={chartData.length < 200}
                animationDuration={400}
              />

              {/* Open price line (lighter) */}
              <Line
                type="monotone"
                dataKey="open"
                stroke="rgba(148,163,184,0.3)"
                strokeWidth={1}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom Stats ───────────────────────────────────────────────── */}
      {marketData && chartData.length > 0 && (() => {
        const closes = chartData.map(d => d.close);
        const highs = chartData.map(d => d.high);
        const lows = chartData.map(d => d.low);
        const periodHigh = Math.max(...highs);
        const periodLow = Math.min(...lows);
        const firstClose = closes[0];
        const lastClose = closes[closes.length - 1];
        const periodChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;

        return (
          <div className="grid grid-cols-4 gap-px mx-4 mb-4 rounded-xl overflow-hidden"
            style={{ background: 'var(--theme-border)' }}>
            {[
              { label: 'Period High', value: fmt(periodHigh, 5), color: '#10b981' },
              { label: 'Period Low', value: fmt(periodLow, 5), color: '#ef4444' },
              { label: 'Period Change', value: `${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(3)}%`, color: periodChange >= 0 ? '#10b981' : '#ef4444' },
              { label: 'Data Points', value: String(chartData.length), color: '#6366f1' },
            ].map(s => (
              <div key={s.label} className="py-2 px-2 text-center"
                style={{ background: 'var(--theme-bg-card)' }}>
                <p className="text-[9px] mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
                <p className="text-[11px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default MarketChartWidget;
