import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, Pencil, Plus, Trash2, X, Building2, Wallet, CreditCard,
  ArrowLeftRight, Check, ChevronDown, QrCode, Link, RefreshCw,
  TrendingUp, Globe, Zap, Search
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Currency {
  code: string
  name: string
  symbol: string
  country: string
  flag: string
  rate: number
}

interface Exchange {
  _id: string
  baseCurrency: string
  targetCurrency: string
  rate: number
  type: string
  isCustomRate: boolean
  lastUpdated: string
}

interface PaymentMethodItem {
  _id: string
  accountHolderName?: string
  type: string
  accountNumber?: string
  active?: boolean
  walletName?: string
  walletAddress?: string
  bankName?: string
  ifsc_swift?: string
  qrCode?: string
  paymentLink?: string
  name?: string
  accounts?: string
}

// ── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, width = 560 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; width?: number
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--theme-bg-card)', borderRadius: '16px',
              border: '1px solid var(--theme-border)', width: '100%', maxWidth: width,
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function ModalHeader({ title, subtitle, onClose, icon, color = '#6366f1' }: {
  title: string; subtitle?: string; onClose: () => void; icon?: React.ReactNode; color?: string
}) {
  return (
    <div style={{
      padding: '20px 24px 16px', borderBottom: '1px solid var(--theme-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: color + '20',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color
          }}>{icon}</div>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 32, height: 32, borderRadius: 8, border: '1px solid var(--theme-border)',
        background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ value, onChange, placeholder, type = 'text', disabled = false, mono = false }: {
  value: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; type?: string; disabled?: boolean; mono?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      step={type === 'number' ? '0.0001' : undefined}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${focused ? '#6366f1' : 'var(--theme-border)'}`,
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
        color: disabled ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)',
        fontSize: 14, outline: 'none', fontFamily: mono ? 'monospace' : 'inherit',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
        transition: 'border-color .2s, box-shadow .2s', boxSizing: 'border-box'
      }}
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? '#10b981' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background .2s', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: 9, background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </div>
  )
}

// ── Payment Type Icon ─────────────────────────────────────────────────────────
function typeIcon(type: string) {
  if (type === 'Bank Account' || type === 'Online Banking') return <Building2 size={16} />
  if (type === 'Crypto Wallet') return <Wallet size={16} />
  return <CreditCard size={16} />
}
function typeColor(type: string) {
  if (type === 'Bank Account' || type === 'Online Banking') return '#6366f1'
  if (type === 'Crypto Wallet') return '#f59e0b'
  return '#10b981'
}

// ── Currency Selector ─────────────────────────────────────────────────────────
function CurrencySelect({ value, onChange, currencies, disabled = false, label }: {
  value: string; onChange: (v: string) => void
  currencies: Currency[]; disabled?: boolean; label?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = currencies.find(c => c.code === value)
  const filtered = search
    ? currencies.filter(c =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : currencies

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: `1px solid ${open ? '#6366f1' : 'var(--theme-border)'}`,
          background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
          color: 'var(--theme-text-primary)', fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color .2s, box-shadow .2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected?.flag && (
            <img src={selected.flag} alt={selected.code} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <span>{selected ? `${selected.code} — ${selected.name}` : 'Select currency'}</span>
        </div>
        <ChevronDown size={14} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1000,
              background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)',
              borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}
          >
            <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid var(--theme-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 7 }}>
                <Search size={13} style={{ color: 'var(--theme-text-muted)', flexShrink: 0 }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search currencies…"
                  onClick={e => e.stopPropagation()}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--theme-text-primary)', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.slice(0, 80).map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                  style={{
                    width: '100%', padding: '8px 14px', textAlign: 'left', background: c.code === value ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--theme-text-primary)', fontSize: 13, transition: 'background .1s'
                  }}
                  onMouseEnter={e => { if (c.code !== value)(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (c.code !== value)(e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  {c.flag && <img src={c.flag} alt={c.code} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                  <span style={{ fontWeight: 600, minWidth: 40 }}>{c.code}</span>
                  <span style={{ color: 'var(--theme-text-muted)', fontSize: 12 }}>{c.name}</span>
                  {c.code === value && <Check size={13} style={{ marginLeft: 'auto', color: '#6366f1' }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentMethod() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentMethod, setCurrentMethod] = useState<any>(null)
  const [dialogMode, setDialogMode] = useState<'update' | 'add'>('update')
  const [activeTab, setActiveTab] = useState('bank')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedMethodDetails, setSelectedMethodDetails] = useState<any>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)

  // Exchange state
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false)
  const [isExchangeDeleteDialogOpen, setIsExchangeDeleteDialogOpen] = useState(false)
  const [currentExchange, setCurrentExchange] = useState<Exchange | null>(null)
  const [formData, setFormData] = useState({ baseCurrency: 'USD', targetCurrency: 'INR', rate: 0, type: 'deposit' })
  const [liveRate, setLiveRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [pmLoading, setPmLoading] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredExRow, setHoveredExRow] = useState<string | null>(null)

  useEffect(() => { fetchPaymentMethods(); fetchExchanges(); fetchCurrencies() }, [])

  // ── Payment Methods API ──────────────────────────────────────────────────────
  const fetchPaymentMethods = async () => {
    setPmLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE_URL}/api/payment-methods`, { headers: { Authorization: `Bearer ${token}` } })
      setPaymentMethods(response.data.data)
    } catch { toast.error('Failed to fetch payment methods') }
    finally { setPmLoading(false) }
  }

  const handleEdit = (method: PaymentMethodItem) => {
    setCurrentMethod(method)
    setDialogMode('update')
    const t = method.type
    if (t === 'Bank Account' || t === 'Online Banking') setActiveTab('bank')
    else if (t === 'Crypto Wallet') setActiveTab('wallet')
    else setActiveTab('other')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const fd = new FormData()
      Object.keys(currentMethod).forEach(key => {
        if (currentMethod[key] !== null && currentMethod[key] !== undefined)
          fd.append(key, currentMethod[key])
      })
      if (qrFile) fd.append('qrCode', qrFile)
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      if (dialogMode === 'update') {
        await axios.put(`${API_BASE_URL}/api/payment-methods/${currentMethod._id}`, fd, { headers })
      } else {
        await axios.post(`${API_BASE_URL}/api/payment-methods`, fd, { headers })
      }
      fetchPaymentMethods()
      setIsDialogOpen(false)
      setQrFile(null)
      setQrPreview(null)
      toast.success(dialogMode === 'update' ? 'Payment method updated' : 'Payment method added')
    } catch { toast.error('Failed to save payment method') }
  }

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/api/payment-methods/${currentMethod._id}`, { headers: { Authorization: `Bearer ${token}` } })
      fetchPaymentMethods()
      setIsDeleteDialogOpen(false)
      toast.success('Payment method deleted')
    } catch { toast.error('Failed to delete payment method') }
  }

  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) { toast.error('Invalid file type. JPEG/PNG/GIF only.'); return }
      if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setQrPreview(reader.result as string)
      reader.readAsDataURL(file)
      setQrFile(file)
    }
  }

  const removeQRFile = () => {
    setQrFile(null); setQrPreview(null)
    const el = document.getElementById('qr-file-input') as HTMLInputElement
    if (el) el.value = ''
  }

  const viewMethodDetails = async (method: PaymentMethodItem) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/api/payment-methods/${method._id}`, { headers: { Authorization: `Bearer ${token}` } })
      setSelectedMethodDetails(res.data.data)
      setIsDetailsDialogOpen(true)
    } catch { toast.error('Failed to fetch method details') }
  }

  const toggleActive = async (method: PaymentMethodItem, checked: boolean) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(`${API_BASE_URL}/api/payment-methods/${method._id}`, { active: checked }, { headers: { Authorization: `Bearer ${token}` } })
      fetchPaymentMethods()
    } catch { toast.error('Failed to update status') }
  }

  // ── Exchange Rates API ───────────────────────────────────────────────────────
  const fetchExchanges = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/api/exchanges`, { headers: { Authorization: `Bearer ${token}` } })
      setExchanges(res.data.data)
    } catch { toast.error('Failed to fetch exchange rates') }
    finally { setLoading(false) }
  }

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/api/exchanges/currencies`, { headers: { Authorization: `Bearer ${token}` } })
      setCurrencies(res.data.data)
    } catch { toast.error('Failed to fetch currencies') }
  }

  const fetchLiveRate = (base: string, target: string) => {
    const bc = currencies.find(c => c.code === base)
    const tc = currencies.find(c => c.code === target)
    if (bc && tc) {
      const rate = tc.rate / bc.rate
      setLiveRate(rate)
      setFormData(prev => ({ ...prev, baseCurrency: base, targetCurrency: target, rate }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'baseCurrency') fetchLiveRate(value, formData.targetCurrency)
    if (name === 'targetCurrency') fetchLiveRate(formData.baseCurrency, value)
  }

  const handleExchangeSave = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const headers = { Authorization: `Bearer ${token}` }
      if (currentExchange?._id) {
        await axios.put(`${API_BASE_URL}/api/exchanges/${currentExchange._id}`, { rate: formData.rate, type: formData.type }, { headers })
        toast.success('Exchange rate updated')
      } else {
        await axios.post(`${API_BASE_URL}/api/exchanges`, formData, { headers })
        toast.success('Exchange rate added')
      }
      fetchExchanges()
      setIsExchangeDialogOpen(false)
    } catch { toast.error('Failed to save exchange rate') }
  }

  const handleExchangeDelete = async () => {
    if (!currentExchange?._id) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/api/exchanges/${currentExchange._id}`, { headers: { Authorization: `Bearer ${token}` } })
      fetchExchanges()
      setIsExchangeDeleteDialogOpen(false)
      toast.success('Exchange rate deleted')
    } catch { toast.error('Failed to delete exchange rate') }
  }

  const handleExchangeEdit = (exchange: Exchange) => {
    setCurrentExchange(exchange)
    setFormData({ baseCurrency: exchange.baseCurrency, targetCurrency: exchange.targetCurrency, rate: exchange.rate, type: exchange.type })
    fetchLiveRate(exchange.baseCurrency, exchange.targetCurrency)
    setIsExchangeDialogOpen(true)
  }

  const handleAddExchangeClick = () => {
    setCurrentExchange(null)
    setFormData({ baseCurrency: 'USD', targetCurrency: 'INR', rate: 0, type: 'deposit' })
    fetchLiveRate('USD', 'INR')
    setIsExchangeDialogOpen(true)
  }

  const getCurrencyFlag = (code: string) => currencies.find(c => c.code === code)?.flag || ''
  const getCurrencyName = (code: string) => currencies.find(c => c.code === code)?.name || code

  // ── Stats ────────────────────────────────────────────────────────────────────
  const activeCount = paymentMethods.filter(m => m.active).length
  const bankCount = paymentMethods.filter(m => m.type === 'Bank Account' || m.type === 'Online Banking').length
  const cryptoCount = paymentMethods.filter(m => m.type === 'Crypto Wallet').length

  const stats = [
    { label: 'Total Methods', value: paymentMethods.length, icon: <CreditCard size={20} />, color: '#6366f1' },
    { label: 'Active', value: activeCount, icon: <Zap size={20} />, color: '#10b981' },
    { label: 'Bank Accounts', value: bankCount, icon: <Building2 size={20} />, color: '#3b82f6' },
    { label: 'Crypto Wallets', value: cryptoCount, icon: <Wallet size={20} />, color: '#f59e0b' },
    { label: 'Exchange Rates', value: exchanges.length, icon: <ArrowLeftRight size={20} />, color: '#8b5cf6' },
  ]

  // ── QR Section component ─────────────────────────────────────────────────────
  const QRSection = () => (
    <FieldGroup label="QR Code">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 8, border: '1.5px dashed var(--theme-border)',
          cursor: 'pointer', transition: 'border-color .2s',
          background: 'rgba(255,255,255,0.03)'
        }}
          onMouseEnter={e => (e.currentTarget as HTMLLabelElement).style.borderColor = '#6366f1'}
          onMouseLeave={e => (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--theme-border)'}
        >
          <QrCode size={18} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>
            {qrFile ? qrFile.name : 'Click to upload QR code (JPEG/PNG/GIF, max 5MB)'}
          </span>
          <input id="qr-file-input" type="file" accept="image/jpeg,image/png,image/gif" onChange={handleQRFileChange} style={{ display: 'none' }} />
        </label>
        {qrPreview && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={qrPreview} alt="QR Preview" style={{ maxWidth: 140, borderRadius: 8, border: '1px solid var(--theme-border)' }} />
            <button onClick={removeQRFile} style={{
              position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%',
              background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff'
            }}><X size={12} /></button>
          </div>
        )}
      </div>
    </FieldGroup>
  )

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', transition: 'all .15s'
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: 'var(--theme-bg-card)', borderRadius: 12,
                border: `1px solid var(--theme-border)`, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: s.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Payment Methods Table ───────────────────────────────────────────── */}
        <div style={{
          background: 'var(--theme-bg-card)', borderRadius: 16,
          border: '1px solid var(--theme-border)', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#6366f118', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)' }}>Payment Methods</div>
                <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{paymentMethods.length} method{paymentMethods.length !== 1 ? 's' : ''} configured</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Bank', type: 'Bank Account', color: '#6366f1' },
                { label: 'Crypto', type: 'Crypto Wallet', color: '#f59e0b' },
                { label: 'Other', type: 'Other', color: '#10b981' },
              ].map(btn => (
                <button key={btn.type}
                  onClick={() => {
                    setCurrentMethod({ type: btn.type, active: false })
                    setDialogMode('add')
                    setActiveTab(btn.type === 'Bank Account' ? 'bank' : btn.type === 'Crypto Wallet' ? 'wallet' : 'other')
                    setIsDialogOpen(true)
                  }}
                  style={{ ...btnBase, background: btn.color + '18', color: btn.color, border: `1px solid ${btn.color}30` }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = btn.color + '30'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = btn.color + '18'}
                >
                  <Plus size={14} />{btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['#', 'Name', 'Type', 'Status', 'Active', 'Actions'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px', textAlign: i >= 4 ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: 'rgba(255,255,255,0.02)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pmLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}>
                          <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
                      No payment methods configured yet
                    </td>
                  </tr>
                ) : (
                  paymentMethods.map((method, idx) => {
                    const color = typeColor(method.type)
                    return (
                      <motion.tr
                        key={method._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onMouseEnter={() => setHoveredRow(method._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderBottom: '1px solid var(--theme-border)',
                          background: hoveredRow === method._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'background .15s'
                        }}
                      >
                        <td style={{ padding: '14px 16px', color: 'var(--theme-text-muted)', fontSize: 13 }}>{idx + 1}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                              {typeIcon(method.type)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-primary)' }}>
                                {method.type === 'Crypto Wallet' ? method.walletName : method.accountHolderName || method.name || '—'}
                              </div>
                              {method.bankName && <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{method.bankName}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + '18', color
                          }}>
                            {typeIcon(method.type)}{method.type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => viewMethodDetails(method)} style={{
                            ...btnBase, padding: '5px 12px', background: 'rgba(255,255,255,0.05)',
                            color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)', fontSize: 12
                          }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
                          >
                            <Eye size={13} />View
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                            <Toggle checked={!!method.active} onChange={v => toggleActive(method, v)} />
                            <span style={{ fontSize: 12, color: method.active ? '#10b981' : 'var(--theme-text-muted)', minWidth: 52 }}>
                              {method.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button onClick={() => handleEdit(method)} style={{
                              width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
                            }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f118'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f160' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => { setCurrentMethod(method); setIsDeleteDialogOpen(true) }} style={{
                              width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
                            }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444418'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef444460' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Exchange Rates Table ─────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--theme-bg-card)', borderRadius: 16,
          border: '1px solid var(--theme-border)', overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#8b5cf618', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)' }}>Exchange Rates</div>
                <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{exchanges.length} rate{exchanges.length !== 1 ? 's' : ''} configured</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchExchanges} style={{
                ...btnBase, background: 'rgba(255,255,255,0.05)',
                color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)', padding: '8px 12px'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
              >
                <RefreshCw size={14} />
              </button>
              <button onClick={handleAddExchangeClick} style={{
                ...btnBase, background: '#8b5cf618', color: '#8b5cf6', border: '1px solid #8b5cf630'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf630'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf618'}
              >
                <Plus size={14} />Add Rate
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['#', 'Base Currency', 'Target Currency', 'Rate', 'Type', 'Last Updated', 'Actions'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px', textAlign: i >= 5 ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: 'rgba(255,255,255,0.02)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}>
                          <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : exchanges.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
                      No exchange rates configured yet
                    </td>
                  </tr>
                ) : (
                  exchanges.map((ex, idx) => (
                    <motion.tr
                      key={ex._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onMouseEnter={() => setHoveredExRow(ex._id)}
                      onMouseLeave={() => setHoveredExRow(null)}
                      style={{
                        borderBottom: '1px solid var(--theme-border)',
                        background: hoveredExRow === ex._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                        transition: 'background .15s'
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: 'var(--theme-text-muted)', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getCurrencyFlag(ex.baseCurrency) && (
                            <img src={getCurrencyFlag(ex.baseCurrency)} alt={ex.baseCurrency} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)' }}>{ex.baseCurrency}</div>
                            <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{getCurrencyName(ex.baseCurrency)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getCurrencyFlag(ex.targetCurrency) && (
                            <img src={getCurrencyFlag(ex.targetCurrency)} alt={ex.targetCurrency} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)' }}>{ex.targetCurrency}</div>
                            <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{getCurrencyName(ex.targetCurrency)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <TrendingUp size={13} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                            {ex.rate.toFixed(4)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 2 }}>
                          1 {ex.baseCurrency} = {ex.rate.toFixed(4)} {ex.targetCurrency}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: ex.type === 'deposit' ? '#10b98118' : '#3b82f618',
                          color: ex.type === 'deposit' ? '#10b981' : '#3b82f6'
                        }}>
                          {ex.type.charAt(0).toUpperCase() + ex.type.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>
                        {new Date(ex.lastUpdated).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={() => handleExchangeEdit(ex)} style={{
                            width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f118'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f160' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => { setCurrentExchange(ex); setIsExchangeDeleteDialogOpen(true) }} style={{
                            width: 32, height: 32, borderRadius: 7, border: '1px solid var(--theme-border)',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--theme-text-muted)', transition: 'all .15s'
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444418'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef444460' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Payment Method Modal ─────────────────────────────────────── */}
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)} width={600}>
        <ModalHeader
          title={dialogMode === 'update' ? 'Update Payment Method' : 'Add Payment Method'}
          subtitle="Configure payment method details"
          onClose={() => setIsDialogOpen(false)}
          icon={<CreditCard size={18} />}
          color="#6366f1"
        />
        <div style={{ padding: '20px 24px' }}>
          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'bank', label: 'Bank Account', icon: <Building2 size={14} /> },
              { id: 'wallet', label: 'Crypto Wallet', icon: <Wallet size={14} /> },
              { id: 'other', label: 'Other', icon: <CreditCard size={14} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--theme-text-muted)',
                transition: 'all .2s'
              }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'bank' && (
              <motion.div key="bank" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FieldGroup label="Account Holder Name">
                    <StyledInput value={currentMethod?.accountHolderName || ''} placeholder="Enter account holder name"
                      onChange={e => setCurrentMethod({ ...currentMethod, accountHolderName: e.target.value, type: 'Bank Account' })} />
                  </FieldGroup>
                  <FieldGroup label="Account Number">
                    <StyledInput value={currentMethod?.accountNumber || ''} placeholder="Enter account number"
                      onChange={e => setCurrentMethod({ ...currentMethod, accountNumber: e.target.value, accounts: e.target.value })} />
                  </FieldGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FieldGroup label="Bank Name">
                    <StyledInput value={currentMethod?.bankName || ''} placeholder="Enter bank name"
                      onChange={e => setCurrentMethod({ ...currentMethod, bankName: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="IFSC / SWIFT Code">
                    <StyledInput value={currentMethod?.ifsc_swift || ''} placeholder="Enter IFSC or SWIFT code"
                      onChange={e => setCurrentMethod({ ...currentMethod, ifsc_swift: e.target.value })} />
                  </FieldGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <QRSection />
                  <FieldGroup label="Payment Link (optional)">
                    <div style={{ position: 'relative' }}>
                      <Link size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-text-muted)' }} />
                      <input type="text" value={currentMethod?.paymentLink || ''} placeholder="https://..."
                        onChange={e => setCurrentMethod({ ...currentMethod, paymentLink: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </FieldGroup>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle checked={!!currentMethod?.active} onChange={v => setCurrentMethod({ ...currentMethod, active: v })} />
                  <span style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>Set as active payment method</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FieldGroup label="Wallet Name">
                    <StyledInput value={currentMethod?.walletName || ''} placeholder="Bitcoin, Ethereum, USDT…"
                      onChange={e => setCurrentMethod({ ...currentMethod, walletName: e.target.value, type: 'Crypto Wallet' })} />
                  </FieldGroup>
                  <FieldGroup label="Account Holder Name">
                    <StyledInput value={currentMethod?.accountHolderName || ''} placeholder="Enter holder name"
                      onChange={e => setCurrentMethod({ ...currentMethod, accountHolderName: e.target.value })} />
                  </FieldGroup>
                </div>
                <FieldGroup label="Wallet Address">
                  <StyledInput value={currentMethod?.walletAddress || ''} placeholder="Enter wallet address" mono
                    onChange={e => setCurrentMethod({ ...currentMethod, walletAddress: e.target.value })} />
                </FieldGroup>
                <QRSection />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle checked={!!currentMethod?.active} onChange={v => setCurrentMethod({ ...currentMethod, active: v })} />
                  <span style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>Set as active payment method</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'other' && (
              <motion.div key="other" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FieldGroup label="Payment Method Name">
                  <StyledInput value={currentMethod?.name || ''} placeholder="Enter payment method name"
                    onChange={e => setCurrentMethod({ ...currentMethod, name: e.target.value, type: 'Other' })} />
                </FieldGroup>
                <FieldGroup label="Payment Details">
                  <StyledInput value={currentMethod?.accounts || ''} placeholder="Enter payment details"
                    onChange={e => setCurrentMethod({ ...currentMethod, accounts: e.target.value })} />
                </FieldGroup>
                <QRSection />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle checked={!!currentMethod?.active} onChange={v => setCurrentMethod({ ...currentMethod, active: v })} />
                  <span style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>Set as active payment method</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsDialogOpen(false)} style={{
            ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)'
          }}>Cancel</button>
          <button onClick={handleSave} style={{ ...btnBase, background: '#6366f1', color: '#fff', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'}
          >
            <Check size={15} />{dialogMode === 'update' ? 'Update Method' : 'Add Method'}
          </button>
        </div>
      </Modal>

      {/* ── Payment Method Details Modal ──────────────────────────────────────── */}
      <Modal open={isDetailsDialogOpen} onClose={() => setIsDetailsDialogOpen(false)} width={500}>
        <ModalHeader
          title="Payment Method Details"
          subtitle={selectedMethodDetails?.type}
          onClose={() => setIsDetailsDialogOpen(false)}
          icon={selectedMethodDetails ? typeIcon(selectedMethodDetails.type) : <Eye size={18} />}
          color={selectedMethodDetails ? typeColor(selectedMethodDetails.type) : '#6366f1'}
        />
        {selectedMethodDetails && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: selectedMethodDetails.active ? '#10b98118' : '#ef444418',
                color: selectedMethodDetails.active ? '#10b981' : '#ef4444'
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                {selectedMethodDetails.active ? 'Active' : 'Inactive'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: typeColor(selectedMethodDetails.type) + '18', color: typeColor(selectedMethodDetails.type)
              }}>
                {typeIcon(selectedMethodDetails.type)}{selectedMethodDetails.type}
              </span>
            </div>

            {selectedMethodDetails.type === 'Bank Account' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Account Holder', value: selectedMethodDetails.accountHolderName },
                  { label: 'Account Number', value: selectedMethodDetails.accountNumber },
                  { label: 'Bank Name', value: selectedMethodDetails.bankName },
                  { label: 'IFSC / SWIFT', value: selectedMethodDetails.ifsc_swift },
                ].map(f => f.value ? (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--theme-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-primary)', wordBreak: 'break-all' }}>{f.value}</div>
                  </div>
                ) : null)}
              </div>
            )}

            {selectedMethodDetails.type === 'Crypto Wallet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--theme-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Wallet Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{selectedMethodDetails.walletName}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--theme-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Wallet Address</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedMethodDetails.walletAddress}</div>
                </div>
              </div>
            )}

            {selectedMethodDetails.type === 'Other' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--theme-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Details</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{selectedMethodDetails.accountNumber}</div>
              </div>
            )}

            {selectedMethodDetails.qrCode && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>QR Code</div>
                <img src={`${API_BASE_URL}${selectedMethodDetails.qrCode}`} alt="QR Code" crossOrigin="anonymous"
                  style={{ maxWidth: 180, borderRadius: 10, border: '1px solid var(--theme-border)' }} />
              </div>
            )}

            {selectedMethodDetails.paymentLink && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--theme-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Link</div>
                <a href={selectedMethodDetails.paymentLink} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#6366f1', wordBreak: 'break-all', textDecoration: 'none' }}>
                  {selectedMethodDetails.paymentLink}
                </a>
              </div>
            )}
          </div>
        )}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setIsDetailsDialogOpen(false)} style={{
            ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)'
          }}>Close</button>
        </div>
      </Modal>

      {/* ── Delete Payment Method Confirm ─────────────────────────────────────── */}
      <Modal open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} width={420}>
        <ModalHeader title="Delete Payment Method" onClose={() => setIsDeleteDialogOpen(false)} icon={<Trash2 size={18} />} color="#ef4444" />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--theme-text-primary)', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: '#ef4444' }}>
                {currentMethod?.type === 'Crypto Wallet' ? currentMethod?.walletName : currentMethod?.accountHolderName || currentMethod?.name}
              </strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsDeleteDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Cancel</button>
          <button onClick={handleDelete} style={{ ...btnBase, background: '#ef4444', color: '#fff', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'}
          >
            <Trash2 size={14} />Delete
          </button>
        </div>
      </Modal>

      {/* ── Add/Edit Exchange Rate Modal ──────────────────────────────────────── */}
      <Modal open={isExchangeDialogOpen} onClose={() => setIsExchangeDialogOpen(false)} width={520}>
        <ModalHeader
          title={currentExchange ? 'Update Exchange Rate' : 'Add Exchange Rate'}
          subtitle="Configure currency exchange rate"
          onClose={() => setIsExchangeDialogOpen(false)}
          icon={<ArrowLeftRight size={18} />}
          color="#8b5cf6"
        />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <CurrencySelect
              label="Base Currency"
              value={formData.baseCurrency}
              onChange={v => handleSelectChange('baseCurrency', v)}
              currencies={currencies}
              disabled={!!currentExchange}
            />
            <CurrencySelect
              label="Target Currency"
              value={formData.targetCurrency}
              onChange={v => handleSelectChange('targetCurrency', v)}
              currencies={currencies}
              disabled={!!currentExchange}
            />
          </div>

          {/* Live Rate Banner */}
          {liveRate !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: 13, color: '#10b981' }}>
                Live rate: <strong>1 {formData.baseCurrency} = {liveRate.toFixed(6)} {formData.targetCurrency}</strong>
              </span>
            </motion.div>
          )}

          <FieldGroup label="Exchange Rate">
            <StyledInput type="number" value={formData.rate}
              onChange={e => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
              placeholder="Enter exchange rate" />
            <div style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginTop: 4 }}>
              1 {formData.baseCurrency} = {(formData.rate || 0).toFixed(4)} {formData.targetCurrency}
            </div>
          </FieldGroup>

          <FieldGroup label="Type">
            <div style={{ display: 'flex', gap: 8 }}>
              {['deposit', 'withdrawal'].map(t => (
                <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t }))} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${formData.type === t ? (t === 'deposit' ? '#10b981' : '#3b82f6') : 'var(--theme-border)'}`,
                  background: formData.type === t ? (t === 'deposit' ? '#10b98118' : '#3b82f618') : 'transparent',
                  color: formData.type === t ? (t === 'deposit' ? '#10b981' : '#3b82f6') : 'var(--theme-text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', textTransform: 'capitalize'
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsExchangeDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Cancel</button>
          <button onClick={handleExchangeSave} style={{ ...btnBase, background: '#8b5cf6', color: '#fff', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6'}
          >
            <Check size={15} />{currentExchange ? 'Update Rate' : 'Add Rate'}
          </button>
        </div>
      </Modal>

      {/* ── Delete Exchange Rate Confirm ──────────────────────────────────────── */}
      <Modal open={isExchangeDeleteDialogOpen} onClose={() => setIsExchangeDeleteDialogOpen(false)} width={420}>
        <ModalHeader title="Delete Exchange Rate" onClose={() => setIsExchangeDeleteDialogOpen(false)} icon={<Trash2 size={18} />} color="#ef4444" />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--theme-text-primary)', lineHeight: 1.6 }}>
              Delete exchange rate <strong style={{ color: '#ef4444' }}>{currentExchange?.baseCurrency} → {currentExchange?.targetCurrency}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsExchangeDeleteDialogOpen(false)} style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>Cancel</button>
          <button onClick={handleExchangeDelete} style={{ ...btnBase, background: '#ef4444', color: '#fff', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'}
          >
            <Trash2 size={14} />Delete
          </button>
        </div>
      </Modal>
    </>
  )
}
