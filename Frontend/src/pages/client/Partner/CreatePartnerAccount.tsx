// Frontend/src/pages/client/Partner/CreatePartnerAccount.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import axios from 'axios'
import { Copy, Share2, Users, Crown, TrendingUp, AlertCircle, Check, Zap, ArrowRight, Shield } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface IBConfiguration { _id: string; referralCode: string | null; status: string; level: number; parentDetails?: { name: string; email: string; referralCode: string; level: number } }

const benefits = [
  { icon: TrendingUp, title: 'Earn Commissions', desc: 'Get paid for every trade your referred clients make.', color: '#10b981' },
  { icon: Users, title: 'Build a Network', desc: 'Grow a multi-level network of traders earning you passive income.', color: '#6366f1' },
  { icon: Shield, title: 'Instant Payouts', desc: 'Withdraw your earned commissions at any time to your wallet.', color: '#f59e0b' },
  { icon: Zap, title: 'Real-Time Tracking', desc: 'Monitor your partner activity and commissions live.', color: '#ec4899' },
]

const CreatePartnerAccount = () => {
  const [ibConfig, setIbConfig] = useState<IBConfiguration | null>(null)
  const [referralLink, setReferralLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [affiliateId, setAffiliateId] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem('clientToken')
        if (!token) { navigate('/login'); return }
        const res = await axios.get(`${API_BASE_URL}/api/ibclients/ib-configurations/my-code`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.success && res.data.ibConfiguration) {
          setIbConfig(res.data.ibConfiguration)
          if (res.data.ibConfiguration.referralCode) {
            const base = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'
            setReferralLink(`${base}/signup/${res.data.ibConfiguration.referralCode}`)
            setAffiliateId(res.data.ibConfiguration.referralCode.toUpperCase())
          }
        }
      } catch { /* silent */ }
    }
    check()
  }, [navigate])

  const handleCreate = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('clientToken')
      if (!token) { navigate('/login'); return }
      const res = await axios.post(`${API_BASE_URL}/api/ibclients/ib-configurations/create`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        setIbConfig(res.data.ibConfiguration)
        if (res.data.ibConfiguration.referralCode) {
          const base = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'
          setReferralLink(`${base}/signup/${res.data.ibConfiguration.referralCode}`)
          setAffiliateId(res.data.ibConfiguration.referralCode.toUpperCase())
        }
        toast.success("Partner account activated!")
      }
    } catch { toast.error("Failed to create partner account.") }
    finally { setLoading(false) }
  }

  const copy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success(`${type === 'code' ? 'Code' : 'Link'} copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Join my network!', text: 'Sign up using my referral link', url: referralLink }); return }
      catch { /* fallback */ }
    }
    copy(referralLink, 'link')
  }

  const hasCode = ibConfig?.referralCode

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 translate-x-24 -translate-y-24"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <Crown className="w-3.5 h-3.5" /> IB Partner Program
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight"
            style={{ color: 'var(--theme-text-primary)' }}>
            Become an{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              IB Partner
            </span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Join our Introducing Broker program and start earning commission on every trade from clients you bring in.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Left: Main Action Card ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 rounded-2xl p-6"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>

          {/* Referrer info */}
          {ibConfig?.parentDetails && (
            <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Crown className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-400 mb-1">Referred by</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{ibConfig.parentDetails.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{ibConfig.parentDetails.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {hasCode ? 'Your Partner Details' : 'Activate Partner Account'}
            </h2>
          </div>

          {!hasCode ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
                <TrendingUp className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                Ready to start earning?
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                Generate your unique referral code and start building your network today.
              </p>
              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }} whileTap={{ scale: 0.97 }}
                onClick={handleCreate} disabled={loading}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 inline-flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {loading ? 'Generating…' : <><Zap className="w-4 h-4" /> Activate Partner Account</>}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              {ibConfig?.status === 'pending' && (
                <div className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-400">Account Pending</p>
                    <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Contact support to activate your IB account.</p>
                  </div>
                </div>
              )}

              {/* Status badge */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--theme-border)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Account Status</span>
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: ibConfig?.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: ibConfig?.status === 'active' ? '#10b981' : '#f59e0b',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ibConfig?.status === 'active' ? '#10b981' : '#f59e0b' }} />
                  {(ibConfig?.status || '').toUpperCase()}
                </span>
              </div>

              {/* Affiliate ID */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                  Affiliate ID
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl font-mono font-bold text-sm"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                    {affiliateId}
                  </div>
                  <motion.button whileTap={{ scale: 0.93 }}
                    onClick={() => copy(ibConfig?.referralCode || '', 'code')}
                    className="p-2.5 rounded-xl transition-all"
                    style={{ background: copied === 'code' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)', color: copied === 'code' ? '#10b981' : '#6366f1' }}>
                    {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                  Referral Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono truncate"
                    style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    {referralLink}
                  </div>
                  <motion.button whileTap={{ scale: 0.93 }}
                    onClick={() => copy(referralLink, 'link')}
                    className="p-2.5 rounded-xl transition-all flex-shrink-0"
                    style={{ background: copied === 'link' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)', color: copied === 'link' ? '#10b981' : '#6366f1' }}>
                    {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.93 }}
                    onClick={handleShare}
                    className="p-2.5 rounded-xl transition-all flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Share this link — when people sign up through it, they'll join your network automatically.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Right: Benefits ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Partner Benefits</h3>
          {benefits.map((b, idx) => (
            <motion.div key={b.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.07 }}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${b.color}18` }}>
                <b.icon className="w-4 h-4" style={{ color: b.color }} />
              </div>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>{b.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{b.desc}</p>
              </div>
            </motion.div>
          ))}

          {hasCode && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/client/partner/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              View IB Dashboard <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default CreatePartnerAccount
