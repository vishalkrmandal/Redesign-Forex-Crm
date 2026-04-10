import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import OTPVerification from './OTPVerification';

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

const WALLETS = [
  { name: 'tetherWalletAddress' as const, label: 'USDT (Tether)', placeholder: 'Enter USDT wallet address', icon: '₮', color: '#26a17b', bgGradient: 'linear-gradient(135deg, #1a5c45, #26a17b)', network: 'TRC-20 / ERC-20' },
  { name: 'ethWalletAddress' as const, label: 'Ethereum (ETH)', placeholder: 'Enter ETH wallet address (0x...)', icon: 'Ξ', color: '#627eea', bgGradient: 'linear-gradient(135deg, #1a2850, #627eea)', network: 'ERC-20' },
  { name: 'trxWalletAddress' as const, label: 'TRON (TRX)', placeholder: 'Enter TRX wallet address (T...)', icon: 'T', color: '#ef0027', bgGradient: 'linear-gradient(135deg, #4a0010, #ef0027)', network: 'TRC-20' },
];

const WalletDetailsForm: React.FC<WalletDetailsFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopy = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success('Address copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPendingFormData(formData);
    setOtpDialogOpen(true);
  };

  const handleOTPVerified = async () => {
    if (!pendingFormData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      const sessionId = sessionStorage.getItem('sessionId');
      const sessionToken = sessionStorage.getItem('sessionToken');
      if (!token) { toast.error("Please login to update your wallet details"); return; }

      const response = await axios.post(`${API_BASE_URL}/api/profile/wallet-details`, pendingFormData, {
        headers: { Authorization: `Bearer ${token}`, 'x-session-id': sessionId || '', 'x-session-token': sessionToken || '' }
      });

      if (response.data.success) {
        toast.success("Wallet details updated. Pending KYC verification.");
        setProfileData((prev: { walletDetails?: typeof formData }) => ({ ...prev, walletDetails: pendingFormData }));
      }
    } catch {
      toast.error("Failed to update wallet details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">

        {/* Info Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <span className="text-sm font-bold" style={{ color: '#6366f1' }}>₿</span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Crypto Wallet Addresses</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              Add your wallet addresses for crypto withdrawals. Double-check — crypto transactions are irreversible.
            </p>
          </div>
        </motion.div>

        {/* Wallet Cards */}
        <div className="space-y-3">
          {WALLETS.map(({ name, label, placeholder, icon, color, bgGradient, network }, idx) => {
            const value = formData[name] || '';
            const hasValue = !!value.trim();
            const isFocused = focusedField === name;
            const isCopied = copiedField === name;

            return (
              <motion.div key={name}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--theme-bg-card)', border: `1px solid ${isFocused ? color + '60' : 'var(--theme-border)'}`, transition: 'border-color 0.2s' }}>
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: bgGradient }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 font-bold text-white text-base">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{label}</p>
                    <p className="text-white/50 text-[10px]">{network}</p>
                  </div>
                  {hasValue && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-white/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="px-5 py-4">
                  <div className="relative">
                    <input name={name} type="text" value={value} onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full pr-12 pl-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                      style={{
                        background: 'var(--theme-bg-main)',
                        border: `1.5px solid ${isFocused ? color : hasValue ? `${color}50` : 'var(--theme-border)'}`,
                        color: 'var(--theme-text-primary)'
                      }}
                      onFocus={() => setFocusedField(name)}
                      onBlur={() => setFocusedField(null)} />
                    {hasValue && (
                      <button type="button" onClick={() => handleCopy(name, value)}
                        className="absolute inset-y-0 right-3 flex items-center justify-center w-8 transition-opacity hover:opacity-70">
                        {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />}
                      </button>
                    )}
                  </div>
                  {hasValue && (
                    <p className="text-[10px] mt-1.5 truncate" style={{ color: 'var(--theme-text-disabled)' }}>
                      {value.slice(0, 12)}…{value.slice(-8)}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs text-center sm:text-left" style={{ color: 'var(--theme-text-muted)' }}>
            Changes require OTP verification and admin KYC approval.
          </p>
          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save & Verify</>}
          </motion.button>
        </motion.div>
      </div>

      {/* OTP Dialog */}
      <OTPVerification open={otpDialogOpen} onOpenChange={setOtpDialogOpen}
        updateType="walletDetails" formData={pendingFormData} onVerified={handleOTPVerified} />
    </form>
  );
};

export default WalletDetailsForm;
