// Frontend/src/pages/client/Trading/TradingPlatforms.tsx
import { useState } from "react"
import { Apple, Globe, Laptop, Smartphone, Shield, Zap, BarChart2, ChevronRight, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "@/context/ThemeContext"

const platforms = [
  {
    icon: Smartphone,
    title: "Android App",
    subtitle: "Download from Play Store",
    badge: "Mobile",
    badgeColor: '#10b981',
    desc: "Full-featured mobile trading on Android with real-time charts.",
    href: "#",
  },
  {
    icon: Apple,
    title: "iOS App",
    subtitle: "Download from App Store",
    badge: "Mobile",
    badgeColor: '#10b981',
    desc: "Seamless trading experience on iPhone and iPad.",
    href: "#",
  },
  {
    icon: Laptop,
    title: "Desktop Client",
    subtitle: "Windows & macOS",
    badge: "Desktop",
    badgeColor: '#6366f1',
    desc: "Advanced trading terminal with professional charting tools.",
    href: "#",
  },
  {
    icon: Globe,
    title: "WebTrader",
    subtitle: "Trade in your browser",
    badge: "Web",
    badgeColor: '#f59e0b',
    desc: "No installation required. Trade from any browser, anywhere.",
    href: "#",
  },
]

const features = [
  { icon: Zap, title: "Ultra-Fast Execution", desc: "Orders executed in under 100ms with no requotes." },
  { icon: Shield, title: "Bank-Grade Security", desc: "256-bit SSL encryption and two-factor authentication." },
  { icon: BarChart2, title: "Advanced Charting", desc: "30+ technical indicators and multiple chart types." },
  { icon: Globe, title: "Multi-Asset Trading", desc: "Forex, indices, commodities, crypto and more." },
]

export default function TradingPlatforms() {
  const { theme } = useTheme()
  const [hoveredPlatform, setHoveredPlatform] = useState<number | null>(null)

  return (
    <div className="space-y-8 pb-8">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 40%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>

        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 translate-x-32 -translate-y-32"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 -translate-x-16 translate-y-16"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              MT5 Platform
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
            style={{ color: 'var(--theme-text-primary)' }}>
            Trade on a{' '}
            <span className="relative inline-block">
              <span className="relative z-10 px-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                World-Class
              </span>
            </span>
            <br />Platform
          </h1>
          <p className="text-base md:text-lg mb-8" style={{ color: 'var(--theme-text-muted)' }}>
            Ultra-fast execution, no dealing desk, no requotes. Trade from any device with professional tools built for serious traders.
          </p>
          <motion.a href="#download"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Start Trading Now <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </motion.div>

      {/* ── Download Options ────────────────────────────────────────────── */}
      <div id="download">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>Download & Access</h2>
          <div className="flex-1 h-px" style={{ background: 'var(--theme-border)' }} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((p, idx) => (
            <motion.a
              key={p.title} href={p.href}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.07, type: 'spring', stiffness: 200, damping: 20 }}
              onHoverStart={() => setHoveredPlatform(idx)}
              onHoverEnd={() => setHoveredPlatform(null)}
              className="group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 no-underline"
              style={{
                background: hoveredPlatform === idx
                  ? `linear-gradient(135deg, ${p.badgeColor}15, ${p.badgeColor}08)`
                  : 'var(--theme-bg-card)',
                border: hoveredPlatform === idx ? `1px solid ${p.badgeColor}40` : '1px solid var(--theme-border)',
                transform: hoveredPlatform === idx ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredPlatform === idx ? `0 12px 40px ${p.badgeColor}20` : 'none',
              }}
            >
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${p.badgeColor}18`, color: p.badgeColor }}>
                  {p.badge}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{ background: `${p.badgeColor}18`, transform: hoveredPlatform === idx ? 'scale(1.1)' : 'scale(1)' }}>
                <p.icon className="w-6 h-6" style={{ color: p.badgeColor }} />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{p.title}</h3>
                <p className="text-[11px] mb-2 font-medium" style={{ color: p.badgeColor }}>{p.subtitle}</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{p.desc}</p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1 text-xs font-semibold mt-auto transition-all duration-200"
                style={{ color: p.badgeColor, opacity: hoveredPlatform === idx ? 1 : 0.6 }}>
                Download <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>Platform Features</h2>
          <div className="flex-1 h-px" style={{ background: 'var(--theme-border)' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.06 }}
              className="rounded-2xl p-5"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>{f.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-white mb-2">Ready to Start?</h3>
          <p className="text-sm text-white/80 mb-6 max-w-md mx-auto">
            Open an account today and access all trading instruments with tight spreads and fast execution.
          </p>
          <motion.a href="#" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-indigo-600 bg-white">
            Open Live Account <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </motion.div>
    </div>
  )
}
