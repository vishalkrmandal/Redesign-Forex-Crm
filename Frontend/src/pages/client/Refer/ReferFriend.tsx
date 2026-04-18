// Frontend/src/pages/client/Refer/ReferFriend.tsx
"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from 'axios'
import { Copy, Check, ArrowRight, Users, Gift, TrendingUp, Share2, Facebook, Twitter, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface IBConfiguration { _id: string; referralCode: string | null; status: string; level: number; parentDetails?: { name: string; email: string; referralCode: string; level: number } }

const steps = [
  { icon: Share2, title: "Share Your Link", desc: "Copy your unique referral link and share with friends via social media or messaging apps.", color: '#6366f1' },
  { icon: Users, title: "Friends Register", desc: "When your friend clicks your link and creates an account, they're linked to your network.", color: '#10b981' },
  { icon: Gift, title: "Earn Rewards", desc: "Receive commissions when your referred friends trade. The more they trade, the more you earn.", color: '#f59e0b' },
]

const socialPlatforms = [
  { name: 'WhatsApp', color: '#25d366', icon: MessageCircle, platform: 'whatsapp' },
  { name: 'Facebook', color: '#1877f2', icon: Facebook, platform: 'facebook' },
  { name: 'Twitter', color: '#1da1f2', icon: Twitter, platform: 'twitter' },
  { name: 'Telegram', color: '#2ca5e0', icon: Send, platform: 'telegram' },
]

const ReferFriend = () => {
  const [copied, setCopied] = useState(false)
  const [ibConfig, setIbConfig] = useState<IBConfiguration | null>(null)
  const [referralLink, setReferralLink] = useState('')
  const [loading, setLoading] = useState(false)
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
        }
        toast.success("Referral code created!")
      }
    } catch { toast.error("Failed to create referral code.") }
    finally { setLoading(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true); toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    if (!referralLink) { toast.error("Create your referral link first!"); return }
    const text = "Join me and start trading! Use my referral link:"
    const urls: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  const hasCode = ibConfig?.referralCode

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(245,158,11,0.12) 60%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 translate-x-24 -translate-y-24"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-8 -translate-x-12 translate-y-12"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            <Gift className="w-3.5 h-3.5" /> Referral Program
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            Refer Friends,<br />
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Earn Rewards
            </span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Share your unique link with friends. When they join and trade, you both benefit. Start building your network today.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Referral Link Card ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Share2 className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Your Referral Link</h2>
          </div>

          {!hasCode ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Gift className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-sm mb-2 font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                No referral code yet
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--theme-text-muted)' }}>
                Generate your unique referral code to start inviting friends.
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleCreate} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {loading ? 'Generating…' : 'Generate Referral Code'}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Link input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono truncate"
                  style={{ background: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                  {referralLink}
                </div>
                <motion.button whileTap={{ scale: 0.94 }} onClick={handleCopy}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                    color: copied ? '#10b981' : '#6366f1',
                    border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(99,102,241,0.3)',
                  }}>
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied!</motion.span>
                    ) : (
                      <motion.span key="copy" className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* Code display */}
              {ibConfig?.referralCode && (
                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-indigo-400">Your Code</p>
                    <p className="text-lg font-black font-mono" style={{ color: 'var(--theme-text-primary)' }}>
                      {ibConfig.referralCode.toUpperCase()}
                    </p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(ibConfig.referralCode!); toast.success('Code copied!') }}
                    className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              )}

              {/* Social Share */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  Share via
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {socialPlatforms.map(s => (
                    <motion.button key={s.platform} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}
                      onClick={() => handleShare(s.platform)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      <span className="text-[9px] font-semibold" style={{ color: s.color }}>{s.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── How It Works ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>How It Works</h2>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <motion.div key={step.title}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${step.color}18` }}>
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: step.color }}>
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{step.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reward highlight */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.2)' }}>
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--theme-text-primary)' }}>Earn on every trade</p>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Receive commissions automatically when your referrals trade.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0 text-amber-400" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ReferFriend
