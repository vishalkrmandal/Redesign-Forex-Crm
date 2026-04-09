// Frontend/src/pages/client/account/OpenNewAccount.tsx
import { AlertCircle, Check, Loader2, TrendingUp, Zap, Shield, ChevronRight, Star, Sparkles } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SERVER_NAME = import.meta.env.VITE_SERVER_NAME

interface Leverage { _id: string; value: string; name: string; active: boolean }
interface AccountGroup { _id: string; value: string; name: string; description?: string }

const GROUP_ICONS = [TrendingUp, Zap, Shield, Star]
const GROUP_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']
const GROUP_GRADIENTS = [
  'from-indigo-500/20 to-purple-500/10',
  'from-emerald-500/20 to-teal-500/10',
  'from-amber-500/20 to-orange-500/10',
  'from-pink-500/20 to-rose-500/10',
  'from-cyan-500/20 to-blue-500/10',
  'from-violet-500/20 to-purple-500/10',
]

const parseFeatures = (desc?: string) =>
  desc ? desc.split(/[\n,]/).map(s => s.trim()).filter(Boolean) : []

export default function OpenNewAccount() {
  const [groups, setGroups] = useState<AccountGroup[]>([])
  const [leverages, setLeverages] = useState<Leverage[]>([])
  const [selectedGroup, setSelectedGroup] = useState<AccountGroup | null>(null)
  const [selectedLeverage, setSelectedLeverage] = useState<Leverage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const [g, l] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/groups`),
        axios.get(`${API_BASE_URL}/api/leverages`),
      ])
      if (g.data.success) setGroups(g.data.data)
      if (l.data.success) setLeverages(l.data.data.filter((x: Leverage) => x.active))
    } catch {
      setError("Failed to load account options. Please refresh.")
      toast.error("Failed to load account options")
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!selectedGroup) { toast.error("Please select an account type"); return }
    if (!selectedLeverage) { toast.error("Please select leverage"); return }
    setIsSubmitting(true)
    try {
      await axios.post(`${API_BASE_URL}/api/accounts/create`, {
        accountType: selectedGroup.value,
        leverage: selectedLeverage.value,
        platform: SERVER_NAME,
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` } })
      toast.success("Account created successfully!")
      navigate('/client/account/list')
    } catch {
      toast.error("Failed to create account. Please try again.")
    } finally { setIsSubmitting(false) }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading account options…</p>
      </motion.div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 rounded-2xl max-w-md"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>{error}</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#6366f1' }}>Try Again</button>
      </motion.div>
    </div>
  )

  const canSubmit = !!selectedGroup && !!selectedLeverage && !isSubmitting

  return (
    <div className="max-w-5xl mx-auto pb-10">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, var(--theme-bg-card) 100%)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-5 -translate-y-24 translate-x-24"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.2)' }}>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">New Account</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Open a Trading Account
        </h1>
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Choose your account type, set your leverage, and start trading in seconds.
        </p>
      </motion.div>

      {/* ── Step 1: Account Type ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#6366f1' }}>1</div>
          <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Select Account Type
          </h2>
          {selectedGroup && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              {selectedGroup.name} Selected
            </motion.span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, idx) => {
            const Icon = GROUP_ICONS[idx % GROUP_ICONS.length]
            const color = GROUP_COLORS[idx % GROUP_COLORS.length]
            const gradient = GROUP_GRADIENTS[idx % GROUP_GRADIENTS.length]
            const isSelected = selectedGroup?.value === group.value
            const features = parseFeatures(group.description)

            return (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGroup(group)}
                className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`
                    : 'var(--theme-bg-card)',
                  border: isSelected ? `2px solid ${color}` : '1px solid var(--theme-border)',
                  boxShadow: isSelected ? `0 0 0 4px ${color}20, 0 8px 32px ${color}20` : 'none',
                }}
              >
                {/* Background gradient blob */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300`}
                  style={{ opacity: isSelected ? 1 : 0 }} />

                {/* Selected indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: color }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {group.name}
                  </h3>

                  {/* Features */}
                  {features.length > 0 ? (
                    <ul className="space-y-1.5 mt-3">
                      {features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs"
                          style={{ color: 'var(--theme-text-muted)' }}>
                          <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                      Standard trading account
                    </p>
                  )}

                  {/* Select button hint */}
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: isSelected ? color : 'var(--theme-text-muted)' }}>
                    {isSelected ? (
                      <><Check className="w-3.5 h-3.5" /> Selected</>
                    ) : (
                      <>Select <ChevronRight className="w-3 h-3" /></>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Step 2: Leverage + Confirm ──────────────────────────────────── */}
      <AnimatePresence>
        {groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 18 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: selectedGroup ? '#6366f1' : 'var(--theme-border)' }}>2</div>
              <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Configure & Create
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Leverage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  Leverage Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {leverages.map(lev => (
                    <motion.button
                      key={lev._id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedLeverage(lev)}
                      className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: selectedLeverage?.value === lev.value ? 'rgba(99,102,241,0.2)' : 'var(--theme-border)',
                        border: selectedLeverage?.value === lev.value ? '1px solid #6366f1' : '1px solid transparent',
                        color: selectedLeverage?.value === lev.value ? '#6366f1' : 'var(--theme-text-muted)',
                      }}
                    >
                      {lev.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Account Type (read-only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  Account Type
                </label>
                <div className="py-2.5 px-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'var(--theme-border)',
                    color: selectedGroup ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
                  }}>
                  {selectedGroup ? selectedGroup.name : 'Select from above →'}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  Trading Platform
                </label>
                <div className="py-2.5 px-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                  {SERVER_NAME || 'MT5'}
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex gap-3 p-3 rounded-xl mb-6"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Your account will be created instantly. You can fund it from your wallet or make a deposit once active.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <motion.button
                whileHover={canSubmit ? { scale: 1.01 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300"
                style={{
                  background: canSubmit
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'var(--theme-border)',
                  color: canSubmit ? 'white' : 'var(--theme-text-muted)',
                  boxShadow: canSubmit ? '0 4px 24px rgba(99,102,241,0.35)' : 'none',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Create Trading Account</>
                )}
              </motion.button>

              {(selectedGroup || selectedLeverage) && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedGroup(null); setSelectedLeverage(null) }}
                  className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  Reset
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
