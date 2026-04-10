// Frontend/src/pages/client/layout/profile/WalletDetailsForm.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, Copy, Check, ShieldCheck, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface WalletDetailsFormProps {
  initialData: {
    tetherWalletAddress?: string;
    ethWalletAddress?: string;
    accountNumber?: string;
    trxWalletAddress?: string;
  };
  setProfileData: (data: any) => void;
}

/* ── Per-token config ────────────────────────────────────────────────────── */
const WALLETS = [
  {
    key: 'tetherWalletAddress',
    label: 'Tether (USDT) Wallet',
    symbol: 'USDT',
    placeholder: 'Enter USDT wallet address (TRC20 / ERC20)',
    color: '#26a17b',
    bg: 'rgba(38,161,123,0.1)',
    border: 'rgba(38,161,123,0.25)',
    logo: '₮',
    network: 'TRC20 / ERC20',
  },
  {
    key: 'ethWalletAddress',
    label: 'Ethereum (ETH) Wallet',
    symbol: 'ETH',
    placeholder: '0x... (ERC20 address)',
    color: '#627eea',
    bg: 'rgba(98,126,234,0.1)',
    border: 'rgba(98,126,234,0.25)',
    logo: 'Ξ',
    network: 'ERC20',
  },
  {
    key: 'trxWalletAddress',
    label: 'TRON (TRX) Wallet',
    symbol: 'TRX',
    placeholder: 'T... (TRON address)',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
    logo: 'T',
    network: 'TRC20',
  },
];

const SectionHead = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div style={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

const WalletDetailsForm: React.FC<WalletDetailsFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState({
    tetherWalletAddress: initialData.tetherWalletAddress || '',
    ethWalletAddress: initialData.ethWalletAddress || '',
    trxWalletAddress: initialData.trxWalletAddress || '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData({
      tetherWalletAddress: initialData.tetherWalletAddress || '',
      ethWalletAddress: initialData.ethWalletAddress || '',
      trxWalletAddress: initialData.trxWalletAddress || '',
    });
  }, [initialData]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleCopy = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
      toast.success('Address copied to clipboard');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) { toast.error('Please login to update wallet details'); return; }
      const res = await axios.post(`${API_BASE_URL}/api/profile/wallet-details`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success('Wallet details updated successfully');
        setSaved(true);
        setProfileData((prev: any) => ({ ...prev, walletDetails: formData }));
      }
    } catch {
      toast.error('Failed to update wallet details');
    } finally {
      setLoading(false);
    }
  };

  const hasData = Object.values(formData).some(v => v.trim() !== '');

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Security Notice ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 12, marginBottom: 24,
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
      }}>
        <ShieldCheck style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 2px' }}>
            Crypto Wallet Security
          </p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Double-check your wallet addresses before saving. Incorrect addresses may result in permanent loss of funds. We are not liable for errors.
          </p>
        </div>
      </div>

      {/* ── Wallet Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {WALLETS.map((wallet, idx) => {
          const isFocused = focusedField === wallet.key;
          const value = (formData as any)[wallet.key] as string;
          const hasValue = value.trim() !== '';

          return (
            <motion.div
              key={wallet.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.06 }}
              style={{
                background: 'var(--theme-bg-card)', borderRadius: 16,
                border: `1px solid ${isFocused ? wallet.color : hasValue ? wallet.border : 'var(--theme-border)'}`,
                overflow: 'hidden',
                boxShadow: isFocused ? `0 0 0 3px ${wallet.color}20` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                background: hasValue ? wallet.bg : 'transparent',
                borderBottom: `1px solid ${hasValue ? wallet.border : 'var(--theme-border)'}`,
                transition: 'background 0.2s',
              }}>
                {/* Token logo */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: wallet.bg, border: `1px solid ${wallet.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: wallet.color,
                  fontFamily: 'monospace',
                }}>
                  {wallet.logo}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text-primary)', marginBottom: 2 }}>
                    {wallet.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: wallet.bg, color: wallet.color, border: `1px solid ${wallet.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                      {wallet.symbol}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--theme-text-disabled)' }}>{wallet.network}</span>
                  </div>
                </div>

                {/* Filled dot */}
                {hasValue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: wallet.color }} />
                    <span style={{ fontSize: 11, color: wallet.color, fontWeight: 600 }}>Saved</span>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div style={{ padding: 18 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: isFocused ? wallet.color : 'var(--theme-text-muted)',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em',
                  transition: 'color 0.15s',
                }}>
                  Wallet Address
                </label>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Wallet icon */}
                  <div style={{
                    width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, borderRadius: 10,
                    background: isFocused ? wallet.bg : 'var(--theme-bg-main)',
                    border: `1px solid ${isFocused ? wallet.border : 'var(--theme-border)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <Wallet style={{ width: 16, height: 16, color: isFocused ? wallet.color : 'var(--theme-text-disabled)' }} />
                  </div>

                  <input
                    type="text"
                    value={value}
                    onChange={e => handleChange(wallet.key, e.target.value)}
                    placeholder={wallet.placeholder}
                    onFocus={() => setFocusedField(wallet.key)}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1, height: 44, paddingLeft: 14, paddingRight: 14, borderRadius: 10,
                      border: `1.5px solid ${isFocused ? wallet.color : hasValue ? wallet.border : 'var(--theme-border)'}`,
                      outline: 'none', fontSize: 13, fontFamily: 'monospace',
                      background: 'var(--theme-bg-main)',
                      color: 'var(--theme-text-primary)',
                      transition: 'border-color 0.15s',
                    }}
                  />

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(wallet.key, value)}
                    disabled={!hasValue}
                    title={hasValue ? 'Copy address' : 'No address to copy'}
                    style={{
                      width: 44, height: 44, borderRadius: 10, border: `1px solid ${hasValue ? wallet.border : 'var(--theme-border)'}`,
                      background: hasValue ? wallet.bg : 'var(--theme-bg-main)',
                      cursor: hasValue ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    {copied === wallet.key
                      ? <Check style={{ width: 15, height: 15, color: '#10b981' }} />
                      : <Copy style={{ width: 15, height: 15, color: hasValue ? wallet.color : 'var(--theme-text-disabled)' }} />
                    }
                  </button>
                </div>

                {/* Address length hint */}
                {hasValue && (
                  <p style={{ fontSize: 11, color: 'var(--theme-text-disabled)', margin: '6px 0 0', paddingLeft: 2 }}>
                    {value.length} characters &nbsp;·&nbsp; starts with "{value.slice(0, 4)}…"
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading || !hasData}
          style={{
            height: 46, paddingLeft: 28, paddingRight: 28, borderRadius: 12, border: 'none',
            cursor: loading || !hasData ? 'not-allowed' : 'pointer',
            background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: loading || !hasData ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: loading || !hasData ? 'none' : saved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(99,102,241,0.35)',
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 15, height: 15, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Saving…
            </>
          ) : (
            <>
              <Save style={{ width: 15, height: 15 }} />
              {saved ? 'Saved!' : 'Save Wallet Details'}
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default WalletDetailsForm;
